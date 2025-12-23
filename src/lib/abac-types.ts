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
  environments?: Record<string, any>;
  action?: {
    name: string,
    metadata?: Record<string, any>
  };
}