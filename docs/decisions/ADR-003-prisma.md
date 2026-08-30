# ADR-003: Prisma ORM

## Status: Accepted

## Context
Need an ORM for PostgreSQL. Options: TypeORM, Prisma, Drizzle, raw SQL.

## Decision
Use **Prisma** as the ORM.

## Rationale
- Type-safe database queries generated from schema
- Excellent migration tooling (`prisma migrate`)
- Schema-as-code is readable and maintainable
- Superior developer experience with auto-completion
- Built-in connection pooling

## Consequences
- Prisma Client must be regenerated after schema changes
- Some complex queries may need raw SQL fallback
- Cold start overhead (mitigated by not targeting serverless)
