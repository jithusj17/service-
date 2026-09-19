import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    // Clean up test data if needed
    try {
      await prisma.user.deleteMany({ where: { email: 'test-e2e@example.com' } });
      await prisma.tenant.deleteMany({ where: { name: 'E2E Test Tenant' } });
    } catch (e) {
      // Ignore if not exists
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('/auth/register (POST)', () => {
    it('should return 400 for bad payload', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'not-an-email',
          password: '123'
        })
        .expect(400);
    });

    it('should successfully register a new tenant and admin user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-e2e@example.com',
          password: 'Password123!',
          firstName: 'E2E',
          lastName: 'User',
          tenantName: 'E2E Test Tenant'
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test-e2e@example.com');
      expect(response.body.user.role).toBe('ADMIN');
    });

    it('should fail to register with an existing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-e2e@example.com',
          password: 'Password123!',
          firstName: 'E2E',
          lastName: 'User',
          tenantName: 'Another Tenant'
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test-e2e@example.com',
          password: 'Password123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });

    it('should fail with incorrect password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test-e2e@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);
    });
  });
});
