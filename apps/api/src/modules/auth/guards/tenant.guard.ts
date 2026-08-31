import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.tenantId) {
      throw new ForbiddenException('Tenant context is missing');
    }

    // Example logic: if a route specifies a :tenantId param, 
    // we can enforce it matches the user's tenantId.
    const routeTenantId = request.params?.tenantId || request.query?.tenantId;
    if (routeTenantId && routeTenantId !== user.tenantId) {
      throw new ForbiddenException('You do not have access to this tenant resource');
    }

    return true;
  }
}
