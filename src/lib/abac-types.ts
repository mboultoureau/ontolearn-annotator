/**
 * ABAC (Attribute-Based Access Control) Type Definitions
 */

export interface AbacRequest {
  subject: {
    id: string;
    [key: string]: any;
  };
  resource: {
    id: string;
    [key: string]: any;
  };
  environment?: Record<string, any>;
  actions?: {
    name: string,
    metadata?: Record<string, any>
  };
}

export interface cachedPermissions {
  version: number;
  // "ProjectId": { "action": { allowed: boolean; cachedAt: number } }
  projects: Record<string, Record<string, { allowed: boolean; cachedAt: number }>>;
}