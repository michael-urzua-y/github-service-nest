import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    HttpModule, // Necesario para el servicio Auth
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}