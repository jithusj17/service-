import { Test, TestingModule } from '@nestjs/testing';
import { WorkOrdersService } from './work-orders.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ClsService } from 'nestjs-cls';
import { WorkOrderStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('WorkOrdersService', () => {
  let service: WorkOrdersService;
  
  const mockPrismaService = {
    extended: {
      workOrder: {
        findUnique: jest.fn(),
      }
    }
  };

  const mockAuditService = { logEvent: jest.fn() };
  const mockClsService = { get: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    service = module.get<WorkOrdersService>(WorkOrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateStatus', () => {
    it('should throw BadRequestException if transition is invalid', async () => {
      // Setup mock to return a work order in RECEIVED state
      mockPrismaService.extended.workOrder.findUnique.mockResolvedValue({ id: '1', status: WorkOrderStatus.RECEIVED });
      
      // Try to transition directly to COMPLETED (invalid)
      await expect(
        service.updateStatus('1', { status: WorkOrderStatus.COMPLETED }, 'user-1', '127.0.0.1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if transition is invalid (completed back to received)', async () => {
      // Setup mock to return a work order in COMPLETED state
      mockPrismaService.extended.workOrder.findUnique.mockResolvedValue({ id: '1', status: WorkOrderStatus.COMPLETED });
      
      // Try to transition directly to RECEIVED (invalid)
      await expect(
        service.updateStatus('1', { status: WorkOrderStatus.RECEIVED }, 'user-1', '127.0.0.1')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
