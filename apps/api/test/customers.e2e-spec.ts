import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('CustomersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Note: This test suite expects a running database
    // It verifies that endpoints are reachable and RBAC guards are mounted
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/customers (GET) - should reject unauthorized requests', () => {
    return request(app.getHttpServer())
      .get('/api/v1/customers')
      .expect(401); // Requires JWT
  });

  it('/api/v1/customers (POST) - should reject unauthorized requests', () => {
    return request(app.getHttpServer())
      .post('/api/v1/customers')
      .send({ firstName: 'Test', lastName: 'User' })
      .expect(401);
  });
});
