import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { PartsService } from './parts.service';
import { PartsController } from './parts.controller';

@Module({
  controllers: [SuppliersController, PartsController],
  providers: [SuppliersService, PartsService],
  exports: [SuppliersService, PartsService],
})
export class InventoryModule {}
