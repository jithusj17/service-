import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { WorkOrderPriority } from '@prisma/client';

export class CreateWorkOrderDto {
  @ApiProperty({ description: 'ID of the customer' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ description: 'ID of the asset' })
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @ApiProperty({ description: 'Detailed description of the problem' })
  @IsString()
  @IsNotEmpty()
  problem: string;

  @ApiProperty({ enum: WorkOrderPriority, required: false })
  @IsEnum(WorkOrderPriority)
  @IsOptional()
  priority?: WorkOrderPriority;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
