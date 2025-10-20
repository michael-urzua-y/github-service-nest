import { Entity, PrimaryColumn, Column } from 'typeorm';

/**
 * @name Account
 * @description Entidad para almacenar la información de las cuentas de la API Open Banking en Aurora MySQL.
 */
@Entity('accounts')
export class Account {
  /**
   * @property accountId
   * @description Identificador único e inmutable de la cuenta (Primary Key).
   */
  @PrimaryColumn({ type: 'varchar', length: 40 })
  accountId: string;

  /**
   * @property status
   * @description Estado del recurso de la cuenta (Enabled, Deleted, etc.).
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  status: string;
  
  /**
   * @property currency
   * @description Identificación de la moneda (PEN, USD, etc.).
   */
  @Column({ type: 'varchar', length: 3 })
  currency: string;

  /**
   * @property accountType
   * @description Tipo de cuenta (Cuentas de Ahorro, Cuenta Corriente).
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  accountType: string;

  /**
   * @property rawJson
   * @description Almacena la respuesta JSON completa de la API.
   */
  @Column({ type: 'json', nullable: true })
  rawJson: any;
}