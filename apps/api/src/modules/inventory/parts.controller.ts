import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PartsService } from './parts.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/guards/permissions.decorator';
import { Permissions } from '../auth/rbac/permissions';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Parts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('parts')
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @Post()
  @RequirePermissions(Permissions.INVENTORY_UPDATE)
  @ApiOperation({ summary: 'Create a new part' })
  create(@Body() dto: CreatePartDto, @Req() req: Request) {
    const user = req.user as any;
    return this.partsService.create(dto, user?.id, req.ip);
  }

  @Get()
  @RequirePermissions(Permissions.INVENTORY_READ)
  @ApiOperation({ summary: 'List all parts' })
  findAll(@Query() query: QueryInventoryDto) {
    return this.partsService.findAll(query);
  }

  @Get('low-stock')
  @RequirePermissions(Permissions.INVENTORY_READ)
  @ApiOperation({ summary: 'Get all parts with low stock' })
  findLowStock() {
    return this.partsService.findLowStock();
  }

  @Get(':id')
  @RequirePermissions(Permissions.INVENTORY_READ)
  @ApiOperation({ summary: 'Get a part by ID' })
  findOne(@Param('id') id: string) {
    return this.partsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.INVENTORY_UPDATE)
  @ApiOperation({ summary: 'Update a part' })
  update(@Param('id') id: string, @Body() dto: UpdatePartDto, @Req() req: Request) {
    const user = req.user as any;
    return this.partsService.update(id, dto, user?.id, req.ip);
  }

  @Post(':id/stock')
  @RequirePermissions(Permissions.INVENTORY_UPDATE)
  @ApiOperation({ summary: 'Adjust stock quantity for a part' })
  adjustStock(@Param('id') id: string, @Body() dto: AdjustStockDto, @Req() req: Request) {
    const user = req.user as any;
    return this.partsService.adjustStock(id, dto, user?.id, req.ip);
  }

  @Get(':id/transactions')
  @RequirePermissions(Permissions.INVENTORY_READ)
  @ApiOperation({ summary: 'Get all transactions for a part' })
  getTransactions(@Param('id') id: string) {
    return this.partsService.getTransactions(id);
  }
}
