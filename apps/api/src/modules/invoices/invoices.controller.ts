import { Controller, Get, Post, Body, Param, Query, Patch, UseGuards, Req } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/guards/permissions.decorator';
import { Permissions } from '../auth/rbac/permissions';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @RequirePermissions(Permissions.INVOICE_CREATE)
  @ApiOperation({ summary: 'Create a new invoice' })
  create(@Body() dto: CreateInvoiceDto, @Req() req: Request) {
    const user = req.user as any;
    return this.invoicesService.create(dto, user?.id, req.ip);
  }

  @Get()
  @RequirePermissions(Permissions.INVOICE_READ)
  @ApiOperation({ summary: 'List all invoices' })
  findAll(@Query() query: QueryInvoiceDto) {
    return this.invoicesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Permissions.INVOICE_READ)
  @ApiOperation({ summary: 'Get an invoice by ID' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id/void')
  @RequirePermissions(Permissions.INVOICE_CREATE) // Using CREATE as admin action proxy
  @ApiOperation({ summary: 'Void an invoice' })
  voidInvoice(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.invoicesService.voidInvoice(id, user?.id, req.ip);
  }
}
