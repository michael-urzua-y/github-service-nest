// src/consent/consent.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiModule } from 'src/api/api.module';
import { AuthModule } from 'src/auth/auth.module';
import { ConsentService } from './consent.service';
import { ConsentController } from './consent.controller'; // <-- IMPORTAR
import { Consent } from './consent.entity';
import { ConfigModule } from '@nestjs/config'; // <-- NECESARIO

@Module({
  imports: [
    ApiModule, 
    AuthModule, 
    ConfigModule, // <--- AÑADIR para acceder a REDIRECT_URI
    TypeOrmModule.forFeature([Consent]),
  ],
  controllers: [ConsentController], // <-- REGISTRAR EL CONTROLADOR
  providers: [ConsentService],
  exports: [ConsentService],
})
export class ConsentModule {}