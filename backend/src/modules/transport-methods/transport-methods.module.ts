import { Module } from '@nestjs/common';
import { TransportMethodsController } from './transport-methods.controller';
import { TransportMethodsService } from './transport-methods.service';

@Module({
  imports: [],
  controllers: [TransportMethodsController],
  providers: [TransportMethodsService],
})
export class TransportMethodsModule {}

