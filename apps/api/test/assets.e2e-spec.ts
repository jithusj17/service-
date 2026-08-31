import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AssetsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/assets (GET) - should reject unauthorized requests', () => {
    return request(app.getHttpServer())
      .get('/api/v1/assets')
      .expect(401);
  });

  it('/api/v1/assets (POST) - should reject unauthorized requests', () => {
    return request(app.getHttpServer())
      .post('/api/v1/assets')
      .send({ assetType: 'BICYCLE', customerId: 'uuid' })
      .expect(401);
  });
});
