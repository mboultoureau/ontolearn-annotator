"use client";

/**
 * Conditional UI Components for ABAC Permissions
 * These components conditionally render children based on user permissions
 */

import type { ReactNode } from "react";
import { usePermissions } from "../hooks/use-permissions";
import type { ActionType, ResourceType } from "../abac-types";

interface PermissionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  projectId?: string;
}

interface CanAccessProps extends PermissionGateProps {
  resource: ResourceType;
  action: ActionType;
}

interface CanReadProps extends PermissionGateProps {
  resource: ResourceType;
}

interface CanWriteProps extends PermissionGateProps {
  resource: ResourceType;
}

interface IsAdminProps extends PermissionGateProps {}

/**
 * Render children only if user has specific permission
 * 
 * @example
 * <CanAccess projectId="123" resource="data.highQuality" action="write">
 *   <Button>Upload Data</Button>
 * </CanAccess>
 */
export function CanAccess({
  children,
  fallback = null,
  projectId,
  resource,
  action,
}: CanAccessProps) {
  const { hasPermission } = usePermissions(projectId);

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Render children only if user can read the resource
 * 
 * @example
 * <CanRead projectId="123" resource="settings.user">
 *   <UserSettingsPanel />
 * </CanRead>
 */
export function CanRead({
  children,
  fallback = null,
  projectId,
  resource,
}: CanReadProps) {
  const { canRead } = usePermissions(projectId);
  
  if (!canRead(resource)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Render children only if user can write to the resource
 * 
 * @example
 * <CanWrite projectId="123" resource="task">
 *   <CreateTaskButton />
 * </CanWrite>
 */
export function CanWrite({
  children,
  fallback = null,
  projectId,
  resource,
}: CanWriteProps) {
  const { canWrite } = usePermissions(projectId);

  if (!canWrite(resource)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
