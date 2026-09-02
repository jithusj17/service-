import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/guards/permissions.decorator';
import { Permissions } from '../auth/rbac/permissions';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @RequirePermissions(Permissions.INVENTORY_UPDATE)
  @ApiOperation({ summary: 'Create a new supplier' })
  create(@Body() dto: CreateSupplierDto, @Req() req: Request) {
    const user = req.user as any;
    return this.suppliersService.create(dto, user?.id, req.ip);
  }

  @Get()
  @RequirePermissions(Permissions.INVENTORY_READ)
  @ApiOperation({ summary: 'List all suppliers' })
  findAll(@Query() query: QueryInventoryDto) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Permissions.INVENTORY_READ)
  @ApiOperation({ summary: 'Get a supplier by ID' })
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.INVENTORY_UPDATE)
  @ApiOperation({ summary: 'Update a supplier' })
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto, @Req() req: Request) {
    const user = req.user as any;
    return this.suppliersService.update(id, dto, user?.id, req.ip);
  }
}
