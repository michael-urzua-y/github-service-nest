import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

/**
 * @name Transaction
 * @description Entidad para almacenar los movimientos/transacciones de las cuentas en Aurora MySQL.
 */
@Entity('transactions')
@Index(['accountId', 'transactionId'], { unique: true }) // Índice para asegurar que no haya transacciones duplicadas por cuenta.
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * @property accountId
   * @description ID de la cuenta a la que pertenece la transacción (Foreign Key lógica).
   */
  @Column({ type: 'varchar', length: 40 })
  accountId: string;

  /**
   * @property transactionId
   * @description Identificador único e inmutable de la transacción dentro de la institución.
   */
  @Column({ type: 'varchar', length: 210 })
  transactionId: string;

  /**
   * @property creditDebitIndicator
   * @description Indica si es una entrada de Crédito o Débito.
   */
  @Column({ type: 'varchar', length: 10 })
  creditDebitIndicator: string;

  /**
   * @property bookingDateTime
   * @description Fecha y hora en que se registra la transacción.
   */
  @Column({ type: 'datetime' })
  bookingDateTime: Date;

  /**
   * @property amount
   * @description Monto de la transacción.
   */
  @Column({ type: 'decimal', precision: 15, scale: 5 })
  amount: number;

  /**
   * @property currency
   * @description Moneda de la transacción.
   */
  @Column({ type: 'varchar', length: 3 })
  currency: string;

  /**
   * @property description
   * @description Más detalles de la transacción (narrativa).
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  /**
   * @property rawJson
   * @description Almacena la respuesta JSON completa de la transacción.
   */
  @Column({ type: 'json', nullable: true })
  rawJson: any;
}