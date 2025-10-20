import { Entity, PrimaryColumn, Column } from 'typeorm';

/**
 * @name Consent
 * @description Entidad para gestionar el estado de los consentimientos (ConsentId) en Aurora MySQL.
 */
@Entity('consents')
export class Consent {
  /**
   * @property consentId
   * @description Identificación única del recurso de consentimiento (Primary Key).
   */
  @PrimaryColumn({ type: 'varchar', length: 36 })
  consentId: string;

  /**
   * @property customerId
   * @description ID interno del cliente (opcional, para mapeo local).
   */
  @Column({ type: 'varchar', length: 50 })
  customerId: string;

  /**
   * @property status
   * @description Estado del consentimiento (AwaitingAuthorisation, Authorised, Rejected, Revoked).
   */
  @Column({ type: 'varchar', length: 30 })
  status: string;

  /**
   * @property accessToken
   * @description Token de acceso del cliente asociado a este consentimiento.
   */
  @Column({ type: 'text', nullable: true })
  accessToken?: string; // <-- CORRECCIÓN: Se marca como opcional en TypeScript (string | undefined)

  /**
   * @property refreshToken
   * @description Token de refresco asociado (si aplica).
   */
  @Column({ type: 'text', nullable: true })
  refreshToken?: string; // <-- CORRECCIÓN FINAL: Se marca como opcional en TypeScript

  /**
   * @property expirationDateTime
   * @description Fecha y hora de expiración del consentimiento.
   */
  @Column({ type: 'datetime', nullable: true })
  expirationDateTime?: Date; // <-- Se marca como opcional en TypeScript
}