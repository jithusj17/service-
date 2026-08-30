# ADR-004: Shared-Database Multi-Tenancy

## Status: Accepted

## Context
Multi-tenancy can be implemented as: shared database with tenant column, schema-per-tenant, or database-per-tenant.

## Decision
Use **shared database with `tenantId` column** on all tenant-scoped tables.

## Rationale
- Simplest to implement and operate
- Most cost-effective (single database)
- Sufficient for expected scale (hundreds of tenants)
- Prisma middleware enforces tenant filtering automatically

## Consequences
- Risk of data leakage if middleware is bypassed (mitigated by integration tests)
- All tenants share database resources
- Schema changes affect all tenants simultaneously
- May need to migrate to schema-per-tenant at very large scale
