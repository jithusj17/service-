import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ApproveEstimateDto {
  @ApiProperty({ description: 'Whether the estimate is approved (true) or rejected (false)' })
  @IsBoolean()
  @IsNotEmpty()
  approved: boolean;
}
