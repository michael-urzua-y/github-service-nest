// src/account/account.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiModule } from 'src/api/api.module';
import { TransactionModule } from 'src/transaction/transaction.module'; // <-- 1. IMPORTAR
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { Account } from './account.entity';

@Module({
  imports: [
    ApiModule,
    TypeOrmModule.forFeature([Account]),
    TransactionModule, // <-- 2. AÑADIR A IMPORTS
  ],
  providers: [AccountService],
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountModule {}