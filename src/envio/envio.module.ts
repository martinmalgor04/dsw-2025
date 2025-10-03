import { Module } from '@nestjs/common';
import { EnvioController } from './envio.controller';
import { EnvioService } from './envio.service';

@Module({
  controllers: [EnvioController],
  providers: [EnvioService],
  exports: [EnvioService],
})
export class EnvioModule {}
