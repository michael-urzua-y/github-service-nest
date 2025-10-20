import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

// Importación de Entidades
import { Account } from './account/account.entity';
import { Transaction } from './transaction/transaction.entity';
import { Consent } from './consent/consent.entity';

// Importación de Módulos
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { TransactionModule } from './transaction/transaction.module';
import { ApiModule } from './api/api.module';
import { ConsentModule } from './consent/consent.module';

@Module({
  imports: [
    // 1. Configuración de Entorno (Global) con validación mediante Joi
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        // Variables obligatorias para la DB
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(3306),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),

        // Variables obligatorias para AuthService
        AUTH_TOKEN_ENDPOINT: Joi.string().uri().required(),
        CLIENT_ID: Joi.string().required(),
        CLIENT_SECRET: Joi.string().required(),
      }),
    }),
    
    // 2. Configuración de Base de Datos (Aurora MySQL)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbPortStr = configService.get<string>('DB_PORT');
        const defaultPort = 3306;
        const dbPort = dbPortStr ? parseInt(dbPortStr, 10) : defaultPort;

        return ({
          type: 'mysql',
          host: configService.get<string>('DB_HOST'),
          port: dbPort,
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          entities: [Account, Transaction, Consent],
          synchronize: true, // Cambiar a false en producción
        });
      },
    }),
    
    // 3. Módulos de Negocio y API
    ApiModule,
    AuthModule,
    ConsentModule,
    AccountModule,
    TransactionModule,
  ],
})
export class AppModule {}
