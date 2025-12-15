"use client";

/**
 * React Hook for ABAC Permissions
 * Provides easy access to user permissions in client components
 */

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import type {
  AbacPermissions,
  ActionType,
  ProjectWithPermissions,
  ResourceType,
} from "../abac-types";
import {
  canRead,
  canWrite,
  getProjectPermissions,
  hasPermission,
  isProjectAdmin,
} from "../abac-client";

export function usePermissions(projectId?: string) {
  const { data: session } = useSession();

  const permissions = useMemo(() => {
    if (!session) return null;
    const token = session as any;
    return (token.permissions as AbacPermissions) || null;
  }, [session]);

  const projectPermissions = useMemo(() => {
    if (!projectId || !permissions) return null;
    return getProjectPermissions(permissions, projectId);
  }, [permissions, projectId]);

  return {
    /**
     * All user permissions across projects
     */
    permissions,

    /**
     * Permissions for the specific project
     */
    projectPermissions,

    /**
     * Check if user has permission for a resource and action
     */
    hasPermission: (resource: ResourceType, action: ActionType) =>
      hasPermission(projectPermissions, resource, action),

    /**
     * Check if user can read a resource
     */
    canRead: (resource: ResourceType) => canRead(projectPermissions, resource),

    /**
     * Check if user can write to a resource
     */
    canWrite: (resource: ResourceType) => canWrite(projectPermissions, resource),

    /**
     * Check if user is admin of the project
     */
    isAdmin: isProjectAdmin(projectPermissions),

    /**
     * Get user's role in the project
     */
    role: projectPermissions?.role,

    /**
     * Get all accessible projects
     */
    projects: permissions?.projects || [],

    /**
     * Check if user has access to the project
     */
    hasProjectAccess: !!projectPermissions,
  };
}
