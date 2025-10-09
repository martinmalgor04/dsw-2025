import { Module } from '@nestjs/common';
import { TransportMethodsController } from './transport-methods.controller';
import { TransportMethodsService } from './transport-methods.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TransportMethodsController],
  providers: [TransportMethodsService],
})
export class TransportMethodsModule {}

