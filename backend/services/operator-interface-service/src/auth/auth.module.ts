import { Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { JwtGuard } from './jwt.guard';

@Module({
  providers: [JwtService, JwtGuard],
  exports: [JwtService, JwtGuard],
})
export class AuthModule {}
