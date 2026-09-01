import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req, Ip } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { AssignWorkOrderDto } from './dto/assign-work-order.dto';
import { QueryWorkOrderDto } from './dto/query-work-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/guards/permissions.decorator';
import { Permissions } from '../auth/rbac/permissions';

@ApiTags('work-orders')
@ApiBearerAuth()
@Controller({ path: 'work-orders', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @RequirePermissions(Permissions.WORK_ORDER_CREATE)
  @ApiOperation({ summary: 'Create a new work order' })
  create(@Body() dto: CreateWorkOrderDto, @Req() req: any, @Ip() ip: string) {
    return this.workOrdersService.create(dto, req.user?.id, ip);
  }

  @Get()
  @RequirePermissions(Permissions.WORK_ORDER_READ)
  @ApiOperation({ summary: 'List work orders with filters and pagination' })
  findAll(@Query() query: QueryWorkOrderDto) {
    return this.workOrdersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Permissions.WORK_ORDER_READ)
  @ApiOperation({ summary: 'Get work order details including timeline' })
  findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(id);
  }

  @Patch(':id/status')
  @RequirePermissions(Permissions.WORK_ORDER_UPDATE)
  @ApiOperation({ summary: 'Update the status of a work order strictly' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderStatusDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.workOrdersService.updateStatus(id, dto, req.user?.id, ip);
  }

  @Patch(':id/assign')
  @RequirePermissions(Permissions.WORK_ORDER_ASSIGN)
  @ApiOperation({ summary: 'Assign a technician to the work order' })
  assignTechnician(
    @Param('id') id: string,
    @Body() dto: AssignWorkOrderDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.workOrdersService.assignTechnician(id, dto, req.user?.id, ip);
  }
}
