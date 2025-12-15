/**
 * ABAC Permission Utilities (Server-Side)
 * Provides functions to check and validate permissions from JWT tokens
 * Note: These functions use server-only APIs and cannot be used in client components
 */

import { auth } from "@/server/auth";
import type {
  AbacPermissions,
  ActionType,
  ResourceType,
} from "./abac-types";

// Re-export client-safe utilities
export {
  getProjectPermissions,
  hasPermission,
  canRead,
  canWrite,
  isProjectAdmin,
  getAccessibleProjects,
  getProjectIdsWithPermission,
  arePermissionsValid,
} from "./abac-client";

/**
 * Get ABAC permissions from the current session token
 */
export async function getAbacPermissions(): Promise<AbacPermissions | null> {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }

  // Extract permissions from JWT token
  // The permissions are stored in the token after being fetched from ABAC service
  const token = session as any;
  
  return token.permissions || null;
}
