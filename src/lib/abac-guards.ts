/**
 * Server-side Permission Guards
 * Middleware and utilities to protect server actions and API routes
 */

import { checkPermission } from "./abac-client";
import type { ABACAction } from "./abac-action-categories";

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
 *   await requirePermission(projectId, "data", "write");
 *   // ... perform deletion
 * }
 */
export async function requirePermission(
  projectId: string,
  resource: string,
  action: string,
  options?: {
    resourceAttributes?: Record<string, any>;
    environment?: Record<string, any>;
  }
): Promise<void> {
  const actionKey = `${resource}:${action}` as ABACAction;
  const hasPermission = await checkPermission(projectId, actionKey, options);
  
  if (!hasPermission) {
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
  resource: string,
  options?: {
    resourceAttributes?: Record<string, any>;
    environment?: Record<string, any>;
  }
): Promise<void> {
  return requirePermission(projectId, resource, "read", options);
}

/**
 * Require user to have write permission
 */
export async function requireWrite(
  projectId: string,
  resource: string,
  options?: {
    resourceAttributes?: Record<string, any>;
    environment?: Record<string, any>;
  }
): Promise<void> {
  return requirePermission(projectId, resource, "write", options);
}