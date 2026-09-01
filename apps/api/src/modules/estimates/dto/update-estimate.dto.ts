import { PartialType } from '@nestjs/swagger';
import { CreateEstimateDto } from './create-estimate.dto';
import { OmitType } from '@nestjs/swagger';

export class UpdateEstimateDto extends PartialType(
  OmitType(CreateEstimateDto, ['workOrderId'] as const)
) {}
