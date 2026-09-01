import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { AuditService } from '../audit/audit.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class DiagnosesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cls: ClsService,
  ) {}

  async create(dto: CreateDiagnosisDto, userId?: string, ipAddress?: string) {
    // A work order should only have one diagnosis
    const existing = await this.prisma.extended.diagnosis.findUnique({
      where: { workOrderId: dto.workOrderId },
    });

    if (existing) {
      throw new BadRequestException('A diagnosis already exists for this work order');
    }

    const diagnosis = await this.prisma.extended.diagnosis.create({
      data: {
        workOrderId: dto.workOrderId,
        tenantId: this.cls.get('tenantId'),
        problemFound: dto.problemFound,
        recommendation: dto.recommendation,
        severity: dto.severity,
        notes: dto.notes,
        attachments: dto.attachments ?? [],
      },
    });

    await this.auditService.logEvent({
      action: 'DIAGNOSIS_CREATED',
      userId,
      tenantId: this.cls.get('tenantId'),
      ipAddress,
      details: { diagnosisId: diagnosis.id, workOrderId: dto.workOrderId },
    });

    return diagnosis;
  }

  async findByWorkOrder(workOrderId: string) {
    const diagnosis = await this.prisma.extended.diagnosis.findUnique({
      where: { workOrderId },
    });

    if (!diagnosis) {
      throw new NotFoundException('Diagnosis not found');
    }

    return diagnosis;
  }

  async update(id: string, dto: UpdateDiagnosisDto, userId?: string, ipAddress?: string) {
    const existing = await this.prisma.extended.diagnosis.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Diagnosis not found');
    }

    const diagnosis = await this.prisma.extended.diagnosis.update({
      where: { id },
      data: {
        problemFound: dto.problemFound,
        recommendation: dto.recommendation,
        severity: dto.severity,
        notes: dto.notes,
        attachments: dto.attachments,
      },
    });

    await this.auditService.logEvent({
      action: 'DIAGNOSIS_UPDATED',
      userId,
      tenantId: this.cls.get('tenantId'),
      ipAddress,
      details: { diagnosisId: diagnosis.id, workOrderId: existing.workOrderId },
    });

    return diagnosis;
  }
}
