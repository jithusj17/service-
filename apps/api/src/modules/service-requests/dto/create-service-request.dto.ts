import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsObject } from 'class-validator';
import { ServiceRequestPriority } from '@prisma/client';

export class CreateServiceRequestDto {
  @ApiProperty({ description: 'ID of the asset needing service' })
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @ApiProperty({ description: 'Detailed description of the problem' })
  @IsString()
  @IsNotEmpty()
  problemDescription: string;

  @ApiProperty({ enum: ServiceRequestPriority, required: false })
  @IsEnum(ServiceRequestPriority)
  @IsOptional()
  priority?: ServiceRequestPriority;

  @ApiProperty({
    description: 'Array of attachment metadata',
    required: false,
    type: [Object],
  })
  @IsArray()
  @IsOptional()
  @IsObject({ each: true })
  attachments?: Record<string, any>[];
}
