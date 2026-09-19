import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Security (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  let tenantAToken: string;
  let tenantBToken: string;
  
  let tenantACustomerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);

    // Register Tenant A
    const resA = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'security-tenantA@example.com',
        password: 'Password123!',
        firstName: 'Tenant',
        lastName: 'A',
        tenantName: 'Security Tenant A'
      });
    tenantAToken = resA.body.accessToken;

    // Register Tenant B
    const resB = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'security-tenantB@example.com',
        password: 'Password123!',
        firstName: 'Tenant',
        lastName: 'B',
        tenantName: 'Security Tenant B'
      });
    tenantBToken = resB.body.accessToken;

    // Create a resource in Tenant A
    const custA = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({
        firstName: 'Tenant A',
        lastName: 'Customer',
        email: 'customer-a@example.com',
      });
    tenantACustomerId = custA.body.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Tenant Isolation (Cross-tenant access)', () => {
    it('Tenant B cannot access Tenant A Customer', async () => {
      await request(app.getHttpServer())
        .get(`/customers/${tenantACustomerId}`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .expect(404); // Should return 404 Not Found since it's isolated by RLS/where clauses
    });

    it('Tenant B cannot modify Tenant A Customer', async () => {
      await request(app.getHttpServer())
        .patch(`/customers/${tenantACustomerId}`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .send({ firstName: 'Hacked' })
        .expect(404); 
    });
  });

  describe('RBAC (Role Based Access Control)', () => {
    it('should prevent unauthenticated access to protected routes', async () => {
      await request(app.getHttpServer())
        .get('/customers')
        .expect(401);
    });
  });
});
