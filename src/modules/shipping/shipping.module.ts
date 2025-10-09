import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { MockDataService } from '../../common/services/mock-data.service';

@Module({
  imports: [PrismaModule],
  controllers: [ShippingController],
  providers: [ShippingService, MockDataService],
  exports: [ShippingService],
})
export class ShippingModule {}

