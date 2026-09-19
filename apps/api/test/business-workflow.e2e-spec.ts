import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Complete Business Workflow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tenantId: string;
  
  let customerId: string;
  let serviceRequestId: string;
  let workOrderId: string;
  let estimateId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);

    // Ensure clean state for workflow test
    try {
      const user = await prisma.user.findUnique({ where: { email: 'workflow-e2e@example.com' } });
      if (user) {
        await prisma.tenant.delete({ where: { id: user.tenantId } }); // Cascade deletes everything
      }
    } catch (e) {
      // Ignore
    }

    // Register test tenant and user
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'workflow-e2e@example.com',
        password: 'Password123!',
        firstName: 'Workflow',
        lastName: 'Admin',
        tenantName: 'Workflow E2E Tenant'
      });
    
    authToken = response.body.accessToken;
    tenantId = response.body.user.tenantId;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. Create Customer', async () => {
    const res = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe.workflow@example.com',
        phone: '555-0199',
        address: '123 Workflow St'
      })
      .expect(201);
    
    customerId = res.body.id;
    expect(customerId).toBeDefined();
  });

  it('2. Create Service Request', async () => {
    const res = await request(app.getHttpServer())
      .post('/service-requests')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId,
        vehicleMake: 'Toyota',
        vehicleModel: 'Camry',
        vehicleYear: 2018,
        description: 'Engine making weird noise'
      })
      .expect(201);
    
    serviceRequestId = res.body.id;
    expect(res.body.status).toBe('PENDING');
  });

  it('3. Generate Work Order', async () => {
    // In our system, maybe we create a work order from a service request
    // Or we create it directly with the customer ID
    const res = await request(app.getHttpServer())
      .post('/work-orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId,
        title: 'Engine Inspection',
        description: 'Engine making weird noise',
        vehicleMake: 'Toyota',
        vehicleModel: 'Camry',
        vehicleYear: 2018
      })
      .expect(201);
    
    workOrderId = res.body.id;
    expect(res.body.status).toBe('RECEIVED');
  });

  it('4. Update Work Order to Diagnosing', async () => {
    await request(app.getHttpServer())
      .patch(`/work-orders/${workOrderId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'DIAGNOSING' })
      .expect(200);
  });

  it('5. Create Estimate', async () => {
    const res = await request(app.getHttpServer())
      .post('/estimates')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        workOrderId,
        items: [
          {
            description: 'Engine Diagnostic',
            type: 'LABOR',
            quantity: 1,
            unitPrice: 150.00
          },
          {
            description: 'Spark Plugs',
            type: 'PART',
            quantity: 4,
            unitPrice: 15.00
          }
        ],
        notes: 'Needs new spark plugs'
      })
      .expect(201);
    
    estimateId = res.body.id;
    expect(estimateId).toBeDefined();
    expect(res.body.status).toBe('DRAFT');
  });

  it('6. Send Estimate to Customer', async () => {
    await request(app.getHttpServer())
      .post(`/estimates/${estimateId}/send`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });

  it('7. Customer Approves Estimate', async () => {
    // This might be a public endpoint, but let's assume admin can approve on behalf, or we simulate customer
    await request(app.getHttpServer())
      .post(`/estimates/${estimateId}/approve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ approved: true, signature: 'John Doe' })
      .expect(200);
  });

  it('8. Complete Work Order', async () => {
    // Status progresses from APPROVED -> IN_PROGRESS -> COMPLETED
    await request(app.getHttpServer())
      .patch(`/work-orders/${workOrderId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/work-orders/${workOrderId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'COMPLETED' })
      .expect(200);
  });

});
