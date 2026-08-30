# ADR-002: Modular Monolith Backend

## Status: Accepted

## Context
The backend could be structured as microservices or a modular monolith.

## Decision
Use a **single NestJS application** with clearly separated domain modules.

## Rationale
- Simpler deployment and operations
- Shared database transactions without distributed coordination
- Easier debugging and local development
- Module boundaries enforce separation without network overhead
- Can extract to microservices later if needed

## Consequences
- All business logic in one process
- Must maintain discipline on module boundaries
- Shared database can become a bottleneck at extreme scale
