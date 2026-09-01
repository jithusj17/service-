import { PartialType } from '@nestjs/swagger';
import { CreateDiagnosisDto } from './create-diagnosis.dto';
import { OmitType } from '@nestjs/swagger';

export class UpdateDiagnosisDto extends PartialType(
  OmitType(CreateDiagnosisDto, ['workOrderId'] as const)
) {}
