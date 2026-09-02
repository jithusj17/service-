import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { InventoryTransactionType } from '@prisma/client';

export class AdjustStockDto {
  @ApiProperty({ enum: InventoryTransactionType })
  @IsEnum(InventoryTransactionType)
  @IsNotEmpty()
  type: InventoryTransactionType;

  @ApiProperty({ description: 'Positive for adding stock, negative for removing' })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
