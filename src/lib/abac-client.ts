import { auth } from "@/server/auth";
import { isActionCacheable } from "@/lib/abac-action-categories";
import { env } from "@/env";
import type { AbacRequest } from "@/lib/abac-types";
import { SignJWT } from "jose";
import prisma from "@/lib/prisma";

// Server-side cache for permissions
// Key format: "userId:projectId:action"
const permissionCache = new Map<string, { allowed: boolean; cachedAt: number }>();

function getCacheKey(userId: string, projectId: string, action: string): string {
  return `${userId}:${projectId}:${action}`;
}

function getCachedPermission(userId: string, projectId: string, action: string): boolean | null {
  const key = getCacheKey(userId, projectId, action);
  const cached = permissionCache.get(key);
  
  if (!cached) return null;
  
  const age = Date.now() - cached.cachedAt;
  if (age >= (env.ABAC_CACHE_TTL * 1000)) {
    permissionCache.delete(key);
    return null;
  }
  
  return cached.allowed;
}

function setCachedPermission(userId: string, projectId: string, action: string, allowed: boolean): void {
  const key = getCacheKey(userId, projectId, action);
  permissionCache.set(key, {
    allowed,
    cachedAt: Date.now()
  });
}

export async function checkPermission(
  projectId: string,
  action: string, // e.g., "settings:read"
  options?: {
    resourceAttributes?: Record<string, any>;
    environments?: Record<string, any>;
  }
): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return false;
  }

  // Get the user's role in the project
  const projectMember = await prisma.projectMember.findFirst({
    where: {
      userId: session.user.id,
      projectId: projectId,
    },
    select: {
      role: true,
    },
  });

  // If user is not a member of the project, deny access
  if (!projectMember) {
    return false;
  }
  
  // Check if action is cacheable and in cache
  if (isActionCacheable(action)) {
    const cached = getCachedPermission(session.user.id, projectId, action);
    if (cached !== null) {
      return cached;
    }
  }
  
  // Make direct ABAC call
  const [resourceType, actionType] = action.split(':'); // "settings:read" → ["settings", "read"]
  const abacToken = await createAbacToken(session.user.id);
  
  try {
    const response = await fetch(env.ABAC_SERVER_URL + '/request_access', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${abacToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: {
          id: session.user.id,
          role: projectMember.role,
          email: session.user.email,
        },
        resource: {
          id: projectId,
          type: resourceType,
        },
        environments: options?.environments || null,
        action: {
          name: actionType,
          metadata: {
            duration: "1d"
          }
        },        
      } as AbacRequest),
    });
    
    if (!response.ok) {
      console.error(`ABAC request failed: ${response.status}`);
      return false;
    }
    
    const result = await response.json();
    const allowed = result.result || false;
    
    // Cache the result if the action is cacheable
    if (isActionCacheable(action)) {
      setCachedPermission(session.user.id, projectId, action, allowed);
    }
    
    return allowed;
  } catch (error) {
    console.error('ABAC error:', error);
    return false; // Fail closed
  }
}

/**
 * Create a signed JWT for ABAC server authentication
 * This is separate from NextAuth's encrypted session token
 */
async function createAbacToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(env.ABAC_SECRET);
  
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h') // Short-lived token for ABAC requests
    .sign(secret);    
  return token;
}