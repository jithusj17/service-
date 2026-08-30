# Security

## Authentication

### JWT Strategy

- **Access Token**: Short-lived (15 minutes), sent via `Authorization: Bearer` header
- **Refresh Token**: Long-lived (7 days), stored in database, used to issue new access tokens
- **Token Rotation**: Each refresh generates a new token pair, invalidating the old refresh token

### Password Security

- Minimum 8 characters, requires uppercase, lowercase, and number
- Hashed with bcrypt (cost factor 12)
- No password stored in plaintext anywhere

## Authorization (RBAC)

### Roles

| Role | Scope | Permissions |
|------|-------|-------------|
| `PLATFORM_ADMIN` | Global | Full system access |
| `TENANT_ADMIN` | Tenant | Manage own tenant, staff, services |
| `PROVIDER` | Tenant | View assigned bookings, update status |
| `CUSTOMER` | Tenant | Book services, view own bookings |

### Guard Chain

```
Request → AuthGuard (JWT) → RolesGuard (RBAC) → TenantGuard (isolation) → Controller
```

## Multi-Tenancy Isolation

- Every tenant-scoped query includes `tenantId` filter via Prisma middleware
- Users can only access data belonging to their tenant
- Platform admins can access cross-tenant data
- Tenant context extracted from JWT payload

## Input Validation

- All input validated via `class-validator` decorators on DTOs
- `whitelist: true` — strips unknown properties
- `forbidNonWhitelisted: true` — rejects requests with unknown properties
- Zod schemas on frontend for client-side validation

## Security Headers

Applied via `helmet`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (in production)
- `Content-Security-Policy` (configured per environment)

## CORS

- Restricted to allowed origins (configured via `CORS_ORIGIN` env var)
- Credentials enabled for cookie-based auth
- Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS

## Rate Limiting

- Global: 100 req/min per IP
- Auth endpoints: 10 req/min per IP
- Uses Redis for distributed rate limiting

## Request Tracing

- Every request gets a unique `X-Request-ID`
- ID propagated through logs, error responses, and downstream services
- Enables end-to-end request tracing

## Known Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| JWT token theft | Short expiry, refresh token rotation |
| SQL injection | Prisma parameterized queries |
| XSS | Helmet headers, React auto-escaping |
| CSRF | SameSite cookies, CORS restrictions |
| Data leakage between tenants | Prisma middleware, integration tests |
| Brute force attacks | Rate limiting, account lockout (Phase 2) |
| Dependency vulnerabilities | Automated `pnpm audit` in CI |
