import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { MockDataService } from '../../common/services/mock-data.service';
import { StockIntegrationModule } from '../../src/stock-integration/stock-integration.module';

@Module({
  imports: [StockIntegrationModule],
  controllers: [ShippingController],
  providers: [ShippingService, MockDataService],
  exports: [ShippingService],
})
export class ShippingModule {}

