import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Multi-Tenancy Isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cls: ClsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    cls = app.get<ClsService>(ClsService);
    
    await app.init();

    // Clean up test DB
    await prisma.extended.user.deleteMany();
    await prisma.extended.tenant.deleteMany();
  });

  afterAll(async () => {
    await prisma.extended.user.deleteMany();
    await prisma.extended.tenant.deleteMany();
    await app.close();
  });

  it('should strictly isolate data between tenants', async () => {
    // 1. Create two tenants without CLS context (so extension allows it)
    const tenantA = await prisma.extended.tenant.create({ data: { name: 'Tenant A' } });
    const tenantB = await prisma.extended.tenant.create({ data: { name: 'Tenant B' } });

    // 2. Create users in both tenants
    const userA = await prisma.extended.user.create({
      data: {
        email: 'usera@test.com',
        name: 'User A',
        passwordHash: 'hash',
        tenantId: tenantA.id,
      },
    });

    const userB = await prisma.extended.user.create({
      data: {
        email: 'userb@test.com',
        name: 'User B',
        passwordHash: 'hash',
        tenantId: tenantB.id,
      },
    });

    // 3. Simulate request in Tenant A's context
    await cls.runWith({ tenantId: tenantA.id } as any, async () => {
      // Find all users (should only return User A)
      const users = await prisma.extended.user.findMany();
      expect(users).toHaveLength(1);
      expect(users[0].id).toBe(userA.id);

      // Attempting to fetch User B explicitly should fail/return null
      const fetchedUserB = await prisma.extended.user.findUnique({
        where: { id: userB.id },
      });
      expect(fetchedUserB).toBeNull();
    });

    // 4. Simulate request in Tenant B's context
    await cls.runWith({ tenantId: tenantB.id } as any, async () => {
      const users = await prisma.extended.user.findMany();
      expect(users).toHaveLength(1);
      expect(users[0].id).toBe(userB.id);
    });
  });

  it('should auto-inject tenantId when creating data if CLS context is present', async () => {
    const tenantC = await prisma.extended.tenant.create({ data: { name: 'Tenant C' } });

    await cls.runWith({ tenantId: tenantC.id } as any, async () => {
      // We do not explicitly pass tenantId here, but the Prisma extension should inject it
      const autoScopedUser = await prisma.extended.user.create({
        data: {
          email: 'autoinject@test.com',
          name: 'Auto Inject User',
          passwordHash: 'hash',
          // tenantId omitted intentionally
        } as any, // Type cast to bypass Prisma type complaining about missing required field
      });

      expect(autoScopedUser.tenantId).toBe(tenantC.id);
    });
  });
});
