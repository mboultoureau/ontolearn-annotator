/**
 * Server-side Permission Guards
 * Middleware and utilities to protect server actions and API routes
 */

import { redirect } from "next/navigation";
import {
  canRead,
  canWrite,
  getAbacPermissions,
  getProjectPermissions,
  hasPermission,
  isProjectAdmin,
} from "./abac";
import type { ActionType, ResourceType } from "./abac-types";

/**
 * Error thrown when permission check fails
 */
export class PermissionDeniedError extends Error {
  constructor(message: string = "Permission denied") {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

/**
 * Require user to have specific permission for a project
 * Throws PermissionDeniedError if permission is not granted
 * 
 * @example
 * async function deleteData(projectId: string, dataId: string) {
 *   await requirePermission(projectId, "data.highQuality", "write");
 *   // ... perform deletion
 * }
 */
export async function requirePermission(
  projectId: string,
  resource: ResourceType,
  action: ActionType
): Promise<void> {
  const permissions = await getAbacPermissions();
  
  if (!permissions) {
    throw new PermissionDeniedError("Not authenticated");
  }

  const projectPermissions = getProjectPermissions(permissions, projectId);
  
  if (!hasPermission(projectPermissions, resource, action)) {
    throw new PermissionDeniedError(
      `No ${action} permission for ${resource} in project ${projectId}`
    );
  }
}

/**
 * Require user to have read permission
 */
export async function requireRead(
  projectId: string,
  resource: ResourceType
): Promise<void> {
  return requirePermission(projectId, resource, "read");
}

/**
 * Require user to have write permission
 */
export async function requireWrite(
  projectId: string,
  resource: ResourceType
): Promise<void> {
  return requirePermission(projectId, resource, "write");
}

/**
 * Require user to be admin of the project
 */
export async function requireProjectAdmin(projectId: string): Promise<void> {
  const permissions = await getAbacPermissions();
  
  if (!permissions) {
    throw new PermissionDeniedError("Not authenticated");
  }

  const projectPermissions = getProjectPermissions(permissions, projectId);
  
  if (!isProjectAdmin(projectPermissions)) {
    throw new PermissionDeniedError(
      `Admin role required for project ${projectId}`
    );
  }
}

/**
 * Require user to have access to the project (any permission)
 */
export async function requireProjectAccess(projectId: string): Promise<void> {
  const permissions = await getAbacPermissions();
  
  if (!permissions) {
    throw new PermissionDeniedError("Not authenticated");
  }

  const projectPermissions = getProjectPermissions(permissions, projectId);
  
  if (!projectPermissions) {
    throw new PermissionDeniedError(
      `No access to project ${projectId}`
    );
  }
}

/**
 * Check permission and return boolean (doesn't throw)
 */
export async function checkPermission(
  projectId: string,
  resource: ResourceType,
  action: ActionType
): Promise<boolean> {
  try {
    await requirePermission(projectId, resource, action);
    return true;
  } catch {
    return false;
  }
}

/**
 * Higher-order function to wrap server actions with permission check
 * 
 * @example
 * const deleteDataAction = withPermission(
 *   "write",
 *   "data.highQuality",
 *   async (projectId: string, dataId: string) => {
 *     // ... delete data
 *   }
 * );
 */
export function withPermission<T extends any[], R>(
  action: ActionType,
  resource: ResourceType,
  handler: (projectId: string, ...args: T) => Promise<R>
) {
  return async (projectId: string, ...args: T): Promise<R> => {
    await requirePermission(projectId, resource, action);
    return handler(projectId, ...args);
  };
}

/**
 * Higher-order function to wrap server actions requiring admin role
 */
export function withAdminRole<T extends any[], R>(
  handler: (projectId: string, ...args: T) => Promise<R>
) {
  return async (projectId: string, ...args: T): Promise<R> => {
    await requireProjectAdmin(projectId);
    return handler(projectId, ...args);
  };
}

/**
 * Redirect to access denied page if permission check fails
 */
export async function requirePermissionOrRedirect(
  projectId: string,
  resource: ResourceType,
  action: ActionType,
  redirectUrl: string = "/access-denied"
): Promise<void> {
  try {
    await requirePermission(projectId, resource, action);
  } catch {
    redirect(redirectUrl);
  }
}
