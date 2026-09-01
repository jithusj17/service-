import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class AssignWorkOrderDto {
  @ApiProperty({ description: 'ID of the technician' })
  @IsString()
  @IsNotEmpty()
  technicianId: string;

  @ApiProperty({ required: false, description: 'Optional note for assignment' })
  @IsString()
  @IsOptional()
  note?: string;
}
