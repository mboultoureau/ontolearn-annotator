/**
 * ABAC (Attribute-Based Access Control) Type Definitions
 */

export interface PermissionAction {
  read: boolean;
  write: boolean;
}

export interface DataPermissions {
  highQuality: PermissionAction;
  lowQuality: PermissionAction;
}

export interface PlaygroundPermissions {
  read: boolean;
  write: boolean;
}

export interface TaskPermissions {
  read: boolean;
  write: boolean;
}

export interface SettingsPermissions {
  general: PermissionAction;
  integration: PermissionAction;
  sourceType: PermissionAction;
  task: PermissionAction;
  user: PermissionAction;
  headwork: PermissionAction;
}

export interface ProjectPermissions {
  data: DataPermissions;
  playground: PlaygroundPermissions;
  task: TaskPermissions;
  settings: SettingsPermissions;
}

export interface ProjectWithPermissions {
  id: string;
  role: "ADMIN" | "USER" | "DATA_SCIENTIST" | "ANNOTATOR";
  permissions: ProjectPermissions;
}

export interface AbacPermissions {
  subjectId: string;
  issuedAt: string;
  validUntil: string;
  projects: ProjectWithPermissions[];
}

/**
 * Permission resource types
 */
export type ResourceType = 
  | "data.highQuality" 
  | "data.lowQuality"
  | "playground"
  | "task"
  | "settings.general"
  | "settings.integration"
  | "settings.sourceType"
  | "settings.task"
  | "settings.user"
  | "settings.headwork";

/**
 * Permission action types
 */
export type ActionType = "read" | "write";

/**
 * Permission check result
 */
export interface PermissionCheck {
  allowed: boolean;
  projectId?: string;
  role?: string;
}
