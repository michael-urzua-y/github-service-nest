import { Controller, Post, Body, Query, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AccountService } from './account.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { ConfigService } from '@nestjs/config';

@Controller('data') 
export class AccountController {
  
  // En una aplicación real, el token se obtiene de un servicio de autenticación
  // que lo recupera de la BD asociado al cliente que llama a este microservicio.
  private readonly MOCK_ACCESS_TOKEN: string; 

  constructor(
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService,
    private readonly configService: ConfigService,
  ) {
    this.MOCK_ACCESS_TOKEN = this.configService.get<string>('MOCK_ACCESS_TOKEN') || 'REEMPLAZAR-CON-TOKEN-REAL';
  }
  
  /**
   * @method fetchAccounts
   * @description Endpoint para extraer cuentas del cliente y guardarlas.
   * Requiere el token de acceso del cliente.
   */
  @Post('fetch-accounts')
  @HttpCode(HttpStatus.OK)
  async fetchAccounts() {
    if (this.MOCK_ACCESS_TOKEN === 'REEMPLAZAR-CON-TOKEN-REAL') {
        throw new UnauthorizedException('Token de Acceso no configurado. Configura MOCK_ACCESS_TOKEN en tu .env');
    }

    const savedAccounts = await this.accountService.fetchAndSaveAccounts(this.MOCK_ACCESS_TOKEN);
    
    return {
      message: `Procesamiento finalizado. Se han guardado ${savedAccounts.length} cuentas.`,
      accounts: savedAccounts.map(a => a.accountId),
    };
  }

  /**
   * @method fetchTransactions
   * @description Endpoint para obtener y guardar las transacciones de una cuenta específica en un rango de fechas.
   * URI de la API: /accounts/{AccountId}/transactions
   */
  @Post('fetch-transactions')
  @HttpCode(HttpStatus.OK)
  async fetchTransactions(
    @Body('accountId') accountId: string,
    @Body('startDate') startDate?: string,
    @Body('endDate') endDate?: string,
  ) {
    if (!accountId) {
      return { error: 'Se requiere el accountId en el body.' };
    }
    if (this.MOCK_ACCESS_TOKEN === 'REEMPLAZAR-CON-TOKEN-REAL') {
        throw new UnauthorizedException('Token de Acceso no configurado.');
    }

    const savedTransactions = await this.transactionService.fetchAndSaveTransactions(
      accountId,
      this.MOCK_ACCESS_TOKEN,
      startDate,
      endDate,
    );

    return {
      message: `Procesamiento finalizado. Se han guardado ${savedTransactions.length} transacciones para la cuenta ${accountId}.`,
    };
  }
}