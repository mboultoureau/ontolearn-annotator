/**
 * ABAC Client Utilities
 * Permission functions for client-side use (don't use server-only APIs)
 */

import type {
  AbacPermissions,
  ActionType,
  ProjectWithPermissions,
  ResourceType,
} from "./abac-types";

/**
 * Get permissions for a specific project
 */
export function getProjectPermissions(
  permissions: AbacPermissions | null,
  projectId: string
): ProjectWithPermissions | null {
  if (!permissions) return null;
  
  return permissions.projects.find(p => p.id === projectId) || null;
}

/**
 * Check if user has permission for a specific resource and action in a project
 */
export function hasPermission(
  projectPermissions: ProjectWithPermissions | null,
  resource: ResourceType,
  action: ActionType
): boolean { 
  if (!projectPermissions) return false;

  const parts = resource.split(".");
  let perms: any = projectPermissions.permissions;

  // Navigate through nested permissions
  for (const part of parts) {
    if (!perms || typeof perms !== "object") return false;
    perms = perms[part];
  }

  // Check the action
  if (typeof perms === "object" && perms !== null) {
    return perms[action] === true;
  }

  return false;
}

/**
 * Shorthand: Check read permission
 */
export function canRead(
  projectPermissions: ProjectWithPermissions | null,
  resource: ResourceType
): boolean {
  return hasPermission(projectPermissions, resource, "read");
}

/**
 * Shorthand: Check write permission
 */
export function canWrite(
  projectPermissions: ProjectWithPermissions | null,
  resource: ResourceType
): boolean {
  return hasPermission(projectPermissions, resource, "write");
}

/**
 * Check if user is admin of a project
 */
export function isProjectAdmin(
  projectPermissions: ProjectWithPermissions | null
): boolean {
  return projectPermissions?.role === "ADMIN";
}

/**
 * Get all projects where user has at least read access
 */
export function getAccessibleProjects(
  permissions: AbacPermissions | null
): ProjectWithPermissions[] {
  if (!permissions) return [];
  return permissions.projects;
}

/**
 * Get all project IDs where user has specific permission
 */
export function getProjectIdsWithPermission(
  permissions: AbacPermissions | null,
  resource: ResourceType,
  action: ActionType
): string[] {
  if (!permissions) return [];
  
  return permissions.projects
    .filter(project => hasPermission(project, resource, action))
    .map(project => project.id);
}

/**
 * Check if permissions are still valid (not expired)
 */
export function arePermissionsValid(permissions: AbacPermissions | null): boolean {
  if (!permissions) return false;
  
  const validUntil = new Date(permissions.validUntil);
  const now = new Date();
  
  return validUntil > now;
}
