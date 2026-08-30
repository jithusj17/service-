# Architecture Overview

## System Architecture

The Local Service Management Platform is a **modular monolith** deployed as a monorepo with three applications:

```
┌──────────────────────────────────────────────────────┐
│                     Clients                          │
│              (Browser / Mobile App)                  │
└──────────────┬──────────────────┬────────────────────┘
               │                  │
       ┌───────▼───────┐  ┌──────▼──────┐
       │   Next.js     │  │   REST API  │
       │   Frontend    │  │   (NestJS)  │
       │   :3000       │  │   :3001     │
       └───────────────┘  └──────┬──────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
             ┌──────▼──────┐ ┌──▼───┐ ┌─────▼─────┐
             │ PostgreSQL  │ │Redis │ │  Worker   │
             │   :5432     │ │:6379 │ │ (BullMQ)  │
             └─────────────┘ └──────┘ └───────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS 10, TypeScript strict |
| ORM | Prisma 5 |
| Database | PostgreSQL 15 |
| Cache/Queue | Redis 7 |
| Job Queue | BullMQ |
| Auth | JWT (access + refresh tokens) |
| API | REST, versioned (`/api/v1`), JSON envelope |

## Monorepo Structure

```
Service/
├── apps/
│   ├── api/         # NestJS backend
│   ├── web/         # Next.js frontend
│   └── worker/      # BullMQ worker
├── packages/
│   └── shared/      # Shared types, constants, utilities
├── docs/            # Documentation
├── docker/          # Docker Compose
└── .github/         # CI/CD workflows
```

## Module Boundaries

### Backend Modules

| Module | Responsibility |
|--------|---------------|
| `config` | Environment validation and typed access |
| `database` | Prisma client, connection, health indicator |
| `health` | Health check endpoints |
| `common` | Shared filters, interceptors, middleware, DTOs |
| `modules/*` | Business feature modules (Phase 2+) |

### Clean Architecture Layers

```
Controller → Service → Repository → Database
     ↓           ↓          ↓
   DTOs      Entities    Prisma
```

- **Controllers**: Handle HTTP requests, validation, route definitions
- **Services**: Business logic, orchestration
- **Repositories**: Data access patterns (abstracted through Prisma)
- **DTOs**: Request/response shapes, validation rules
- **Entities**: Domain models (mapped from Prisma models)

## Multi-Tenancy

- **Strategy**: Shared database with `tenantId` column
- **Enforcement**: Prisma middleware automatically filters queries by tenant
- **Isolation**: All tenant-scoped queries include `WHERE tenantId = ?`

## Authentication & Authorization

- **Method**: JWT Bearer tokens
- **Access Token**: 15-minute expiry, stateless
- **Refresh Token**: 7-day expiry, stored in database
- **RBAC Roles**: PLATFORM_ADMIN, TENANT_ADMIN, PROVIDER, CUSTOMER
- **Guards**: `AuthGuard` (JWT validation) + `RolesGuard` (role checking)

## Event Architecture

- **Synchronous**: NestJS EventEmitter for in-process events
- **Asynchronous**: BullMQ queues for background processing
- **Real-time**: Socket.IO for live updates (Phase 3+)

## Scalability Considerations

1. **Database**: Connection pooling via Prisma, read replicas possible
2. **Redis**: Used for caching, sessions, and job queues
3. **Worker**: Horizontally scalable (multiple worker instances)
4. **API**: Stateless, horizontally scalable behind a load balancer
