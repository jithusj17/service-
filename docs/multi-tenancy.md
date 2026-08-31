# Multi-Tenancy Architecture

This platform uses a strictly enforced multi-tenancy model to ensure data isolation between different tenants (e.g., organizations, companies, or separate businesses using the platform).

## Core Principles

1. **Never trust client input:** The `tenantId` is never read from the request body or query string. It is strictly extracted from the user's authenticated session (JWT).
2. **Transparent scoping:** Developers do not need to manually append `where: { tenantId }` to every database query. It is handled automatically.
3. **Database-level isolation:** We utilize Prisma Client Extensions to globally intercept database operations.

## How it works

### 1. Context Storage (CLS)
We use `nestjs-cls` (Continuation-Local Storage) to maintain context across the asynchronous lifecycle of a request.
When a request comes in:
- The `JwtAuthGuard` validates the token and attaches the user payload to `req.user`.
- The `TenantInterceptor` fires immediately after, extracting `req.user.tenantId` and saving it to the CLS context.

### 2. Prisma Client Extension
The `PrismaService` is wrapped with a custom Prisma Client Extension (`tenant.extension.ts`).
Whenever a database operation is executed:
- The extension checks if the target model is tenant-aware (e.g., `User`, `AuditEvent`).
- It reads the current `tenantId` from the CLS context.
- For **Reads/Updates/Deletes**: It injects `where: { tenantId }`.
- For **Creates**: It injects `data: { tenantId }`.

### 3. Adding New Tenant-Aware Models
When you create a new model in `schema.prisma` that belongs to a tenant (e.g., `Booking`, `Service`):
1. Ensure the model has a `tenantId String` field.
2. Open `src/database/tenant.extension.ts`.
3. Add the model name to the `TENANT_MODELS` array.

```typescript
const TENANT_MODELS = ['User', 'AuditEvent', 'Service', 'Booking'];
```
That's it! The Prisma extension will automatically secure the new model.

## Bypassing Tenant Isolation
In rare cases (e.g., background workers processing all tenants, or a super-admin dashboard), you may need to bypass the tenant scope.
Because the scope relies on the CLS context, any code executed **outside of an HTTP request** (where the Interceptor doesn't run) will naturally bypass the scoping (e.g., Cron Jobs, BullMQ Workers), as `cls.get('tenantId')` will be undefined.
If you need to bypass it within an HTTP request, you can explicitly clear the CLS context using `cls.runWith()` or create a secondary PrismaClient instance that lacks the extension.
