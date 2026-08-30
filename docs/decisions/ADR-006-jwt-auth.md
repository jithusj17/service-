# ADR-006: JWT Authentication

## Status: Accepted

## Context
Need authentication for the API. Options: session-based, JWT, OAuth2/OIDC (delegated).

## Decision
Use **JWT access + refresh token** pattern.

## Rationale
- Stateless access tokens — API servers need no session store
- Works seamlessly with Next.js middleware for route protection
- Refresh token rotation prevents long-term token reuse
- Standard pattern, well-documented, compatible with mobile clients

## Consequences
- Cannot revoke access tokens before expiry (mitigated by short 15min expiry)
- Refresh tokens must be stored securely (database)
- Token payload size affects request overhead
- Must implement refresh flow on frontend
