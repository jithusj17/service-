# Local Service Management Platform

## Project Context

A multi-tenant SaaS platform for managing local services (e.g., plumbing, cleaning, tutoring, repairs). Service providers can manage their bookings, customers, and daily operations through a unified platform.

## Vision

Enable local service businesses to digitize their operations — from appointment booking to payment tracking — with a platform that is simple enough for small businesses yet powerful enough to scale.

## Key Personas

- **Platform Admin**: Manages the entire platform, tenants, and system settings.
- **Business Owner (Tenant Admin)**: Manages their own business, staff, services, and settings.
- **Service Provider (Staff)**: Views assigned bookings, updates status, manages their schedule.
- **Customer**: Books services, tracks appointments, leaves reviews.

## Core Features (Future Phases)

1. **Multi-Tenancy**: Each business operates in its own isolated tenant.
2. **Service Catalog**: Define services with pricing, duration, and categories.
3. **Booking Management**: Create, schedule, reschedule, and cancel bookings.
4. **Customer Management**: Track customer profiles, history, and preferences.
5. **Staff Management**: Assign roles, manage availability and schedules.
6. **Notifications**: Email/SMS/Push for booking confirmations, reminders.
7. **Payments**: Track payments and invoices.
8. **Reviews & Ratings**: Customer feedback on completed services.
9. **Dashboard & Analytics**: Business insights and performance metrics.
10. **Real-Time Updates**: Live booking status via WebSockets.

## Tech Stack

- **Backend**: NestJS, TypeScript, Prisma, PostgreSQL
- **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- **Worker**: BullMQ, Redis
- **Infrastructure**: Docker, Docker Compose

## Architecture

- Monorepo (pnpm workspaces)
- Modular monolith (no microservices)
- Clean Architecture principles
- Shared-database multi-tenancy
- JWT authentication with RBAC
