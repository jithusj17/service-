import { Prisma } from '@prisma/client';
import { ClsService } from 'nestjs-cls';

// List of models that are strictly tenant-bound.
// Update this list as new tenant-aware models are added.
const TENANT_MODELS = ['User', 'AuditEvent', 'Customer', 'Asset', 'ServiceRequest'];

export const createTenantExtension = (cls: ClsService) => {
  return Prisma.defineExtension({
    name: 'tenant-extension',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const tenantId = cls.get('tenantId');

          // If there is no tenantId in context, or the model is not tenant-aware, proceed as normal.
          // Note: If you want to strictly block queries without a tenantId for these models,
          // you could throw an error here when `!tenantId`.
          if (!tenantId || !TENANT_MODELS.includes(model)) {
            return query(args);
          }

          const argsToPass = args as any;

          // For read/update/delete operations, ensure `where` includes tenantId
          if (['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'count', 'update', 'updateMany', 'delete', 'deleteMany', 'aggregate', 'groupBy'].includes(operation)) {
            argsToPass.where = { ...argsToPass.where, tenantId };
          }

          // For create operations, inject the tenantId into the data payload
          if (operation === 'create') {
            argsToPass.data = { ...argsToPass.data, tenantId };
          }

          if (operation === 'createMany') {
            if (Array.isArray(argsToPass.data)) {
              argsToPass.data = argsToPass.data.map((d: any) => ({ ...d, tenantId }));
            } else {
              argsToPass.data = { ...argsToPass.data, tenantId };
            }
          }

          if (operation === 'upsert') {
            argsToPass.where = { ...argsToPass.where, tenantId };
            argsToPass.create = { ...argsToPass.create, tenantId };
            // Note: Upsert update doesn't strictly need tenantId as where clause restricts it, 
            // but Prisma might complain if we don't handle relations correctly.
          }

          return query(argsToPass);
        },
      },
    },
  });
};
