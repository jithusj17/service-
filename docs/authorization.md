# Authorization Architecture (RBAC)

This platform employs a highly secure and performant Role-Based Access Control (RBAC) mechanism. 
Authorization operates entirely on the backend, enforcing strict data isolation without relying on frontend enforcement. 

## The Static Roles Model

Rather than defining complex database tables for `Roles` and `Permissions`, which requires heavy JOINs on every API request, the platform utilizes a **Static Mapping** approach.

### 1. The `Role` Enum
There are 6 distinct roles defined at the database level (`schema.prisma`):
- `OWNER`: Full access to the tenant platform.
- `ADMIN`: Full access to tenant operations but cannot perform destructive tenant-level actions (billing, deletion).
- `MANAGER`: Access to reporting and operational oversight.
- `TECHNICIAN`: Access to read details and update repairs they are assigned to.
- `STAFF`: Access to create customers, assets, invoices, and process intake.
- `CUSTOMER`: Access strictly limited to viewing their own profiles, assets, and invoices.

### 2. The `Permissions` Dictionary
All granular permissions are statically defined in `apps/api/src/modules/auth/rbac/permissions.ts`.
Examples: `customer.read`, `customer.create`, `repair.update`.

### 3. The `RolePermissions` Mapping
`apps/api/src/modules/auth/rbac/role-mapping.ts` exports a constant dictionary mapping each `Role` to its allowed array of `Permission` strings.

## How Authorization Works

1. **Authentication**: The user logs in and receives a JWT. The JWT securely encodes the user's `Role` as a string (e.g. `roles: ["MANAGER"]`).
2. **The Guard**: A request is made to an endpoint protected by `@RequirePermissions(Permissions.CUSTOMER_CREATE)`.
3. **Validation**: The `PermissionsGuard` intercepts the request:
   - Extracts the role from the JWT payload.
   - Looks up the role in the static `RolePermissions` mapping.
   - Verifies if `customer.create` exists in the array of permissions granted to the role.
   - If not, throws a `403 Forbidden` exception.

## Tenant Scope vs Permissions
Permissions dictate **"WHAT"** a user is allowed to do.
Tenant scoping dictates **"WHERE"** they are allowed to do it.

Even if an `OWNER` has `customer.delete` permission, they cannot delete a customer belonging to another tenant. This is mathematically guaranteed by the Prisma Tenant Extension (`tenant.extension.ts`) which blindly intercepts all database queries and appends `where: { tenantId: req.user.tenantId }` regardless of permissions.

## Using the Decorators

When creating a new Controller, protect your endpoints using the following decorators:

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/guards/permissions.decorator';
import { Permissions } from '../auth/rbac/permissions';

@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomersController {
  
  @Post()
  @RequirePermissions(Permissions.CUSTOMER_CREATE)
  createCustomer() {
    // ...
  }
}
```

By adding `@UseGuards(JwtAuthGuard, PermissionsGuard)` at the Controller level, all endpoints are securely locked down. You can then specify exact granular permissions at the method level using `@RequirePermissions()`. If no permission is specified, the endpoint defaults to only requiring that the user is authenticated.
