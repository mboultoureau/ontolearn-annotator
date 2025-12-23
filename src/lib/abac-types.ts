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