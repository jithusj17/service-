import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateAssetDto } from './create-asset.dto';

// Prevent changing the customerId during an update
export class UpdateAssetDto extends PartialType(OmitType(CreateAssetDto, ['customerId'] as const)) {}
