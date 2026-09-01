import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { WorkOrderStatus } from '@prisma/client';

export class UpdateWorkOrderStatusDto {
  @ApiProperty({ enum: WorkOrderStatus })
  @IsEnum(WorkOrderStatus)
  @IsNotEmpty()
  status: WorkOrderStatus;

  @ApiProperty({ required: false, description: 'Optional note explaining the status change' })
  @IsString()
  @IsOptional()
  note?: string;
}
