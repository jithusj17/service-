import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateEstimateDto {
  @ApiProperty({ description: 'ID of the associated work order' })
  @IsString()
  @IsNotEmpty()
  workOrderId: string;

  @ApiProperty({ required: false, description: 'Array of labor items' })
  @IsArray()
  @IsOptional()
  laborItems?: any[];

  @ApiProperty({ required: false, description: 'Array of part items' })
  @IsArray()
  @IsOptional()
  parts?: any[];

  @ApiProperty()
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  expirationDate?: string;
}
