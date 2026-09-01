import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray } from 'class-validator';
import { DiagnosisSeverity } from '@prisma/client';

export class CreateDiagnosisDto {
  @ApiProperty({ description: 'ID of the associated work order' })
  @IsString()
  @IsNotEmpty()
  workOrderId: string;

  @ApiProperty({ description: 'The problem found by the technician' })
  @IsString()
  @IsNotEmpty()
  problemFound: string;

  @ApiProperty({ description: 'The recommendation for repair' })
  @IsString()
  @IsNotEmpty()
  recommendation: string;

  @ApiProperty({ enum: DiagnosisSeverity, required: false })
  @IsEnum(DiagnosisSeverity)
  @IsOptional()
  severity?: DiagnosisSeverity;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  attachments?: any[];
}
