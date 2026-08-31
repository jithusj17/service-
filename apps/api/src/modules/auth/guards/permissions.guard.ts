import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { Permission } from '../rbac/permissions';
import { RolePermissions } from '../rbac/role-mapping';
import { Role } from '@prisma/client';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.roles || user.roles.length === 0) {
      throw new ForbiddenException('No roles assigned');
    }

    // Assuming user.roles contains the primary role assigned to the user
    // e.g. ["OWNER"] or ["MANAGER"]
    const userRoles: Role[] = user.roles;

    const hasPermission = () => {
      // Gather all permissions across all user roles
      const userPermissions = new Set<Permission>();
      for (const role of userRoles) {
        const perms = RolePermissions[role] || [];
        perms.forEach(p => userPermissions.add(p));
      }

      // Check if user has ALL required permissions
      return requiredPermissions.every(permission => userPermissions.has(permission));
    };

    if (!hasPermission()) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
