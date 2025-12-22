export const ABAC_ACTIONS = {
  // Cacheable actions (read-only, frequent, low-risk)
  CACHEABLE: [
    'settings:read',
    'data:read',
    'task:read',
    'playground:read',
    'playground:write',
    'project:read',
    'statistics:read',
    'user:list',
    'sourceType:list',
  ],
  
  // Always verify (mutations, sensitive operations)
  ALWAYS_VERIFY: [
    'settings:write',
    'data:write',
    'data:delete',
    'task:write',
    'project:write',
    'project:delete',
    'user:invite',
    'user:delete',
    'user:edit',
  ],
} as const;

export const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day

export function isActionCacheable(action: string): boolean {
  return ABAC_ACTIONS.CACHEABLE.includes(action as any);
}