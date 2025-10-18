import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { MockDataService } from './services/mock-data.service';

@Module({
  imports: [HttpModule],
  controllers: [ShippingController],
  providers: [ShippingService, MockDataService],
  exports: [ShippingService],
})
export class ShippingModule {}

