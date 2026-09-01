import { Test, TestingModule } from '@nestjs/testing';
import { EstimatesService } from './estimates.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ClsService } from 'nestjs-cls';
import { EstimateStatus, WorkOrderStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('EstimatesService', () => {
  let service: EstimatesService;
  
  const mockPrismaService: any = {
    extended: {
      $transaction: jest.fn((callback) => callback(mockPrismaService.extended)),
      estimate: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      workOrder: {
        update: jest.fn(),
      },
      workOrderTimelineEvent: {
        create: jest.fn(),
      }
    }
  };

  const mockAuditService = { logEvent: jest.fn() };
  const mockClsService = { get: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstimatesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    service = module.get<EstimatesService>(EstimatesService);
    jest.clearAllMocks();
  });

  describe('handleCustomerApproval', () => {
    it('should throw BadRequest if estimate is in DRAFT state', async () => {
      mockPrismaService.extended.estimate.findUnique.mockResolvedValue({ 
        id: '1', 
        status: EstimateStatus.DRAFT,
        workOrder: { status: WorkOrderStatus.WAITING_FOR_APPROVAL }
      });
      
      await expect(
        service.handleCustomerApproval('1', { approved: true }, 'user-1', '127.0.0.1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should return early (idempotent) if already APPROVED', async () => {
      const mockEstimate = { 
        id: '1', 
        status: EstimateStatus.APPROVED,
        workOrder: { status: WorkOrderStatus.APPROVED }
      };
      mockPrismaService.extended.estimate.findUnique.mockResolvedValue(mockEstimate);
      
      const result = await service.handleCustomerApproval('1', { approved: true }, 'user-1', '127.0.0.1');
      
      // Should not call update
      expect(mockPrismaService.extended.estimate.update).not.toHaveBeenCalled();
      expect(result).toEqual(mockEstimate);
    });

    it('should update estimate to APPROVED and work order if in SENT state', async () => {
      mockPrismaService.extended.estimate.findUnique.mockResolvedValue({ 
        id: '1', 
        workOrderId: 'wo-1',
        status: EstimateStatus.SENT,
        workOrder: { status: WorkOrderStatus.WAITING_FOR_APPROVAL }
      });
      
      mockPrismaService.extended.estimate.update.mockResolvedValue({ id: '1', status: EstimateStatus.APPROVED });

      await service.handleCustomerApproval('1', { approved: true }, 'user-1', '127.0.0.1');
      
      // Verify estimate was updated to APPROVED
      expect(mockPrismaService.extended.estimate.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: EstimateStatus.APPROVED }
      });

      // Verify work order was updated to APPROVED
      expect(mockPrismaService.extended.workOrder.update).toHaveBeenCalledWith({
        where: { id: 'wo-1' },
        data: { status: WorkOrderStatus.APPROVED }
      });
      
      // Verify audit was called
      expect(mockAuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'ESTIMATE_APPROVED'
      }));
    });
  });
});
