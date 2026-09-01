import { Controller, Post, Body, Patch, Param, Get, UseGuards, Req, Ip } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DiagnosesService } from './diagnoses.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/guards/permissions.decorator';
import { Permissions } from '../auth/rbac/permissions';

@ApiTags('diagnoses')
@ApiBearerAuth()
@Controller({ path: 'diagnoses', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DiagnosesController {
  constructor(private readonly diagnosesService: DiagnosesService) {}

  @Post()
  @RequirePermissions(Permissions.DIAGNOSIS_CREATE)
  @ApiOperation({ summary: 'Record a diagnosis for a work order' })
  create(@Body() dto: CreateDiagnosisDto, @Req() req: any, @Ip() ip: string) {
    return this.diagnosesService.create(dto, req.user?.id, ip);
  }

  @Get('work-order/:workOrderId')
  @RequirePermissions(Permissions.DIAGNOSIS_READ)
  @ApiOperation({ summary: 'Get diagnosis by work order ID' })
  findByWorkOrder(@Param('workOrderId') workOrderId: string) {
    return this.diagnosesService.findByWorkOrder(workOrderId);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.DIAGNOSIS_UPDATE)
  @ApiOperation({ summary: 'Update a diagnosis' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDiagnosisDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    return this.diagnosesService.update(id, dto, req.user?.id, ip);
  }
}
