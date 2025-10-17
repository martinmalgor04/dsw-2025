import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ShippingModule } from './modules/shipping/shipping.module';
import { TransportMethodsModule } from './modules/transport-methods/transport-methods.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ShippingModule, TransportMethodsModule, ConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
