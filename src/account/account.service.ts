import { Injectable, Logger } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './account.entity';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly apiService: ApiService,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  /**
   * @method fetchAndSaveAccounts
   * @description Obtiene la lista de cuentas autorizadas del cliente y las persiste en Aurora MySQL.
   * URI: GET /accounts
   * @param customerAccessToken El token obtenido del flujo Authorization Code.
   */
  async fetchAndSaveAccounts(customerAccessToken: string): Promise<Account[]> {
    this.logger.log('Consultando listado de cuentas...');
    
    try {
        // 1. Consumir la API Externa
        const response = await this.apiService.get('/accounts', customerAccessToken);
        
        // La respuesta contiene Data.Account[]
        const accountsData = response.Data?.Account || []; 
        
        if (accountsData.length === 0) {
          this.logger.warn('No se encontraron cuentas autorizadas.');
          return [];
        }

        // 2. Mapear y Persistir en Aurora MySQL
        const newAccounts: Partial<Account>[] = accountsData.map(account => ({
          accountId: account.AccountId, //
          status: account.Status, //
          currency: account.Currency, //
          accountType: account.AccountType, //
          rawJson: account, 
        }));

        // Usamos save: Si la cuenta existe (por accountId), se actualiza (upsert).
        const savedAccounts = await this.accountRepository.save(newAccounts); 
        
        this.logger.log(`Se han guardado ${savedAccounts.length} cuentas en la BD.`);
        return savedAccounts;
        
    } catch (error) {
        this.logger.error('Fallo al obtener o guardar cuentas.', error.stack);
        throw error;
    }
  }
}