import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req, Ip } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import { QueryServiceRequestDto } from './dto/query-service-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/guards/permissions.decorator';
import { Permissions } from '../auth/rbac/permissions';

@ApiTags('service-requests')
@ApiBearerAuth()
@Controller({ path: 'service-requests', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Post()
  @RequirePermissions(Permissions.SERVICE_REQUEST_CREATE)
  @ApiOperation({ summary: 'Create a new service request' })
  create(@Body() dto: CreateServiceRequestDto, @Req() req: any, @Ip() ip: string) {
    return this.serviceRequestsService.create(dto, req.user?.id, ip);
  }

  @Get()
  @RequirePermissions(Permissions.SERVICE_REQUEST_READ)
  @ApiOperation({ summary: 'List service requests with filters and pagination' })
  findAll(@Query() query: QueryServiceRequestDto) {
    return this.serviceRequestsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Permissions.SERVICE_REQUEST_READ)
  @ApiOperation({ summary: 'Get service request details' })
  findOne(@Param('id') id: string) {
    return this.serviceRequestsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.SERVICE_REQUEST_UPDATE)
  @ApiOperation({ summary: 'Update service request details (e.g. status)' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceRequestDto, @Req() req: any, @Ip() ip: string) {
    return this.serviceRequestsService.update(id, dto, req.user?.id, ip);
  }
}
