// ─── API Response Envelope ─────────────────────────
export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
    timestamp: string;
  };
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

// ─── Pagination ────────────────────────────────────
export interface PaginationParams {
  page: number;
  limit: number;
}

// ─── Auth ──────────────────────────────────────────
export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── Tenant ────────────────────────────────────────
export interface Tenant {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ─── User ──────────────────────────────────────────
export enum UserRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  PROVIDER = 'PROVIDER',
  CUSTOMER = 'CUSTOMER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  status: UserStatus | string;
  isEmailVerified: boolean;
  tenantId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ─── Session & Tokens ──────────────────────────────
export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date | string;
  ipAddress?: string | null;
  userAgent?: string | null;
  revokedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface VerificationToken {
  id: string;
  userId: string;
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
  token: string;
  expiresAt: Date | string;
  usedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ─── Audit Event ───────────────────────────────────
export interface AuditEvent {
  id: string;
  action: string;
  userId?: string | null;
  tenantId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: Date | string;
}

// ─── Booking ───────────────────────────────────────
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

// ─── Payment ───────────────────────────────────────
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}
