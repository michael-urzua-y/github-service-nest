import { Injectable, Logger } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    private readonly apiService: ApiService,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  /**
   * @method fetchAndSaveTransactions
   * @description Obtiene los movimientos de una cuenta por ID y los persiste en Aurora MySQL.
   * URI: GET /accounts/{AccountId}/transactions
   * @param accountId El ID de la cuenta.
   * @param customerAccessToken El token obtenido del flujo Authorization Code.
   * @param startDate Fecha de inicio para la consulta histórica (Formato YYYY-MM-DDTHH:mm:ss).
   * @param endDate Fecha de fin para la consulta histórica (Formato YYYY-MM-DDTHH:mm:ss).
   */
  async fetchAndSaveTransactions(
    accountId: string,
    customerAccessToken: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Transaction[]> {
    this.logger.log(`Consultando movimientos para AccountId: ${accountId}...`);
    
    let path = `/accounts/${accountId}/transactions`;
    const queryParams = new URLSearchParams();

    // Lógica para construir los Query Params para consultas históricas o diarias
    if (startDate) {
      queryParams.append('fromBookingDateTime', startDate);
    }
    if (endDate) {
      queryParams.append('toBookingDateTime', endDate);
    }
    
    if (queryParams.toString()) {
      path = `${path}?${queryParams.toString()}`;
    }

    try {
        // 1. Consumir la API Externa
        const response = await this.apiService.get(path, customerAccessToken);

        // La respuesta contiene Data.Transaction[]
        const transactionsData = response.Data?.Transaction || [];
        
        if (transactionsData.length === 0) {
          this.logger.warn(`No se encontraron transacciones para AccountId: ${accountId} en el rango especificado.`);
          return [];
        }

        // 2. Mapear y Persistir en Aurora MySQL
        const newTransactions: Partial<Transaction>[] = transactionsData.map(txn => ({
          accountId: txn.AccountId,
          transactionId: txn.TransactionId, //
          creditDebitIndicator: txn.CreditDebitIndicator, //
          status: txn.Status, //
          bookingDateTime: new Date(txn.BookingDateTime), //
          amount: parseFloat(txn.Amount.Amount), // Monto
          currency: txn.Amount.Currency, // Moneda
          description: txn.TransactionInformation, // Narrativa
          rawJson: txn,
        }));
        
        // Guardar las transacciones. Esto podría ser un batch insert para eficiencia.
        const savedTransactions = await this.transactionRepository.save(newTransactions);

        this.logger.log(`Se han guardado ${savedTransactions.length} movimientos para ${accountId}.`);
        return savedTransactions;
        
    } catch (error) {
        this.logger.error(`Fallo al obtener o guardar transacciones para ${accountId}.`, error.stack);
        throw error;
    }
  }
}