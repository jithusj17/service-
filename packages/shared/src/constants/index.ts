// ─── API ───────────────────────────────────────────
export const API_PREFIX = 'api';
export const API_VERSION = 'v1';
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// ─── Queue Names ───────────────────────────────────
export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  BOOKING: 'booking',
  CLEANUP: 'cleanup',
} as const;

// ─── Redis Key Prefixes ────────────────────────────
export const REDIS_PREFIXES = {
  SESSION: 'session:',
  RATE_LIMIT: 'rate-limit:',
  CACHE: 'cache:',
} as const;

// ─── Error Codes ───────────────────────────────────
export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  FORBIDDEN: 'AUTH_FORBIDDEN',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Resource
  NOT_FOUND: 'RESOURCE_NOT_FOUND',
  CONFLICT: 'RESOURCE_CONFLICT',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Tenant
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  TENANT_INACTIVE: 'TENANT_INACTIVE',
} as const;
