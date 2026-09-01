import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateServiceRequestDto } from './create-service-request.dto';
import { ServiceRequestState } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateServiceRequestDto extends PartialType(CreateServiceRequestDto) {
  @ApiProperty({ enum: ServiceRequestState, required: false })
  @IsEnum(ServiceRequestState)
  @IsOptional()
  state?: ServiceRequestState;
}
