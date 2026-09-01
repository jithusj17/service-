import { Controller, Post, Body, Patch, Param, Get, UseGuards, Req, Ip } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EstimatesService } from './estimates.service';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';
import { ApproveEstimateDto } from './dto/approve-estimate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/guards/permissions.decorator';
import { Permissions } from '../auth/rbac/permissions';
import { EstimateStatus } from '@prisma/client';

@ApiTags('estimates')
@ApiBearerAuth()
@Controller({ path: 'estimates', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Post()
  @RequirePermissions(Permissions.ESTIMATE_CREATE)
  @ApiOperation({ summary: 'Create a new draft estimate' })
  create(@Body() dto: CreateEstimateDto, @Req() req: any, @Ip() ip: string) {
    return this.estimatesService.create(dto, req.user?.id, ip);
  }

  @Get('work-order/:workOrderId')
  @RequirePermissions(Permissions.ESTIMATE_READ)
  @ApiOperation({ summary: 'Get all estimates for a work order' })
  findByWorkOrder(@Param('workOrderId') workOrderId: string) {
    return this.estimatesService.findByWorkOrder(workOrderId);
  }

  @Get(':id')
  @RequirePermissions(Permissions.ESTIMATE_READ)
  @ApiOperation({ summary: 'Get an estimate by ID' })
  findOne(@Param('id') id: string) {
    return this.estimatesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.ESTIMATE_UPDATE)
  @ApiOperation({ summary: 'Update a draft estimate' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEstimateDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.estimatesService.update(id, dto, req.user?.id, ip);
  }

  @Patch(':id/send')
  @RequirePermissions(Permissions.ESTIMATE_UPDATE)
  @ApiOperation({ summary: 'Mark an estimate as SENT' })
  sendEstimate(
    @Param('id') id: string,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.estimatesService.updateStatus(id, EstimateStatus.SENT, req.user?.id, ip);
  }

  @Patch(':id/approve')
  @RequirePermissions(Permissions.ESTIMATE_APPROVE)
  @ApiOperation({ summary: 'Customer approves or rejects an estimate' })
  customerApprove(
    @Param('id') id: string,
    @Body() dto: ApproveEstimateDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.estimatesService.handleCustomerApproval(id, dto, req.user?.id, ip);
  }
}
