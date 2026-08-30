# Authentication Architecture (Phase 2)

## Overview

The Service Platform uses a stateless JWT authentication system combined with stateful Refresh Tokens stored in the database. This provides the performance benefits of JWTs alongside the security of being able to instantly revoke a user's session.

## Models Involved

- **Tenant**: Represents the business entity. Required for all users.
- **User**: The actual user account. Tied to a Tenant.
- **Session**: Represents a refresh token. Stores device info and tracks revocation.
- **VerificationToken**: Used for email verification and password resets.
- **AuditEvent**: Tracks all security-sensitive actions (logins, logouts, resets, failures).

## Tokens

### Access Token
- **Format**: JWT (JSON Web Token)
- **Lifespan**: 15 Minutes
- **Storage**: Frontend memory (or short-lived localStorage during transitions).
- **Contents**: `sub` (userId), `email`, `tenantId`, `roles`.
- **Validation**: Stateless via Passport JWT strategy.

### Refresh Token
- **Format**: Opaque string (crypto-secure hex).
- **Lifespan**: 7 Days
- **Storage**: Database (`sessions` table) and frontend local storage.
- **Rotation**: A new refresh token is issued every time the access token is refreshed. The old refresh token is marked as `revokedAt = now()`.

## Security Measures

### Password Hashing
- **Algorithm**: `bcrypt`
- **Cost Factor**: 12
- Passwords are never returned in API responses or logged.

### Rate Limiting
- Handled globally by `@nestjs/throttler` backed by Redis.
- **Global Endpoints**: 100 requests per minute per IP.
- **Auth Endpoints**: 10 requests per minute per IP to prevent brute-force attacks.

### Audit Logging
The `AuditService` records events into the `audit_events` table for:
- `USER_REGISTERED`
- `USER_LOGIN`
- `LOGIN_FAILED_INVALID_USER`
- `LOGIN_FAILED_INVALID_PASSWORD`
- `PASSWORD_RESET_REQUESTED`
- `PASSWORD_RESET_COMPLETED`
- `EMAIL_VERIFIED`
- `USER_LOGOUT`

## Frontend Integration

The React frontend utilizes `AuthProvider` context which:
1. Validates the JWT on mount.
2. Exposes `login` and `logout` functions to all components.
3. Configures an Axios interceptor: If *any* API request returns `401 Unauthorized`, the interceptor automatically pauses the request, hits the `/auth/refresh` endpoint using the stored refresh token, updates local storage, and transparently retries the original request.
