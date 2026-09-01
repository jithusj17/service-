import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkOrderStatus, WorkOrderPriority } from '@prisma/client';

export class QueryWorkOrderDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assetId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  technicianId?: string;

  @ApiProperty({ enum: WorkOrderStatus, required: false })
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @ApiProperty({ enum: WorkOrderPriority, required: false })
  @IsOptional()
  @IsEnum(WorkOrderPriority)
  priority?: WorkOrderPriority;
}
