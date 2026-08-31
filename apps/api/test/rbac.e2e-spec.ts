import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { PermissionsGuard } from '../src/modules/auth/guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PERMISSIONS_KEY } from '../src/modules/auth/guards/permissions.decorator';
import { Permissions } from '../src/modules/auth/rbac/permissions';
import { ForbiddenException } from '@nestjs/common';

describe('RBAC PermissionsGuard (Unit/Integration)', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const createMockContext = (roles: Role[], requiredPermissions: string[]): ExecutionContext => {
    // Mock reflector to return the required permissions
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredPermissions);

    // Mock ExecutionContext
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: 'mock-user-id',
            tenantId: 'mock-tenant-id',
            roles: roles,
          },
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow OWNER to access any route', () => {
    const context = createMockContext([Role.OWNER], [Permissions.CUSTOMER_CREATE, Permissions.ASSET_READ]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow CUSTOMER to access customer.read', () => {
    const context = createMockContext([Role.CUSTOMER], [Permissions.CUSTOMER_READ]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny CUSTOMER access to user.update', () => {
    const context = createMockContext([Role.CUSTOMER], [Permissions.USER_UPDATE]);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Insufficient permissions');
  });

  it('should allow STAFF to access customer.create', () => {
    const context = createMockContext([Role.STAFF], [Permissions.CUSTOMER_CREATE]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny STAFF access to user.create', () => {
    const context = createMockContext([Role.STAFF], [Permissions.USER_CREATE]);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access if no permissions are required', () => {
    const context = createMockContext([Role.CUSTOMER], []);
    // Ensure reflector returns empty array
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user has no roles assigned', () => {
    const context = createMockContext([], [Permissions.CUSTOMER_READ]);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('No roles assigned');
  });
});
