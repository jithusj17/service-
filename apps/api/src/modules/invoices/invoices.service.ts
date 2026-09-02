import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { Prisma, InvoiceStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cls: ClsService,
  ) {}

  async create(dto: CreateInvoiceDto, userId?: string, ipAddress?: string) {
    const items = dto.items.map((item) => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = dto.tax || 0;
    const discount = dto.discount || 0;
    const total = subtotal + tax - discount;

    const invoiceNumber = `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const invoice = await this.prisma.extended.invoice.create({
      data: {
        invoiceNumber,
        customerId: dto.customerId,
        workOrderId: dto.workOrderId,
        status: InvoiceStatus.ISSUED,
        items: items as Prisma.InputJsonArray,
        subtotal,
        tax,
        discount,
        total,
        issuedAt: new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      } as any,
    });

    await this.auditService.logEvent({
      action: 'INVOICE_CREATED',
      userId,
      tenantId: this.cls.get('tenantId'),
      ipAddress,
      details: { invoiceId: invoice.id, invoiceNumber },
    });

    return invoice;
  }

  async findAll(query: QueryInvoiceDto) {
    const { page = 1, limit = 10, search, customerId, workOrderId, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};

    if (customerId) where.customerId = customerId;
    if (workOrderId) where.workOrderId = workOrderId;
    if (status) where.status = status;
    if (search) {
      where.invoiceNumber = { contains: search, mode: 'insensitive' };
    }

    const [total, data] = await Promise.all([
      this.prisma.extended.invoice.count({ where }),
      this.prisma.extended.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          workOrder: { select: { workOrderNumber: true } },
          payments: true,
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.extended.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        workOrder: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async voidInvoice(id: string, userId?: string, ipAddress?: string) {
    const existing = await this.prisma.extended.invoice.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Invoice not found');
    }

    const updated = await this.prisma.extended.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.VOID },
    });

    await this.auditService.logEvent({
      action: 'INVOICE_VOIDED',
      userId,
      tenantId: this.cls.get('tenantId'),
      ipAddress,
      details: { invoiceId: id },
    });

    return updated;
  }
}
