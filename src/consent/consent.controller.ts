import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, BadRequestException, Logger } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { ConfigService } from '@nestjs/config';

/**
 * Controller para manejar flujos de consentimiento.
 * Incluye endpoints para iniciar el consentimiento y manejar el callback del banco.
 */
@Controller('consent')
export class ConsentController {
  private readonly logger = new Logger(ConsentController.name);

  constructor(
    private readonly consentService: ConsentService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Endpoint para iniciar la solicitud de consentimiento.
   * POST /consent/start
   */
  @Post('start')
  @HttpCode(HttpStatus.OK)
  async startConsentFlow(
    @Body('customerId') customerId: string,
    @Body('codeChallenge') codeChallenge: string,
    @Body('state') state: string,
    @Body('requestJWS') requestJWS: string,
    @Body('data') data: {
      permissions: string[];
      expirationDateTime: string;
      transactionFromDateTime: string;
      transactionToDateTime: string;
    },
  ) {
    this.logger.log('Recibida solicitud para iniciar el flujo de consentimiento.');

    if (!customerId || !codeChallenge || !state || !requestJWS || !data) {
      throw new BadRequestException(
        'Faltan parámetros obligatorios en el body: customerId, codeChallenge, state, requestJWS, data'
      );
    }

    const redirectUri = this.configService.get<string>('REDIRECT_URI');
    if (!redirectUri) {
      this.logger.error('La variable de entorno REDIRECT_URI no está configurada.');
      throw new Error('REDIRECT_URI no configurada en el .env');
    }

    const result = await this.consentService.createAuthorizationUrl(
      customerId,
      codeChallenge,
      redirectUri,
      state,
      requestJWS,
      data,
    );

    return {
      consentId: result.consentId,
      authorizationUrl: result.authorizationUrl,
      status: 'AwaitingAuthorisation',
    };
  }

  /**
   * Endpoint para manejar el callback de autorización desde el banco.
   * GET /consent/callback?code=...&state=...&code_verifier=...&consentId=...
   */
  @Get('callback')
  @HttpCode(HttpStatus.OK)
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('code_verifier') codeVerifier: string,
    @Query('consentId') consentId: string,
  ) {
    this.logger.log(`Callback recibido para ConsentId: ${consentId}`);

    if (!code || !state || !codeVerifier || !consentId) {
      throw new BadRequestException(
        'Parámetros de callback incompletos: code, state, code_verifier, consentId'
      );
    }

    const redirectUri = this.configService.get<string>('REDIRECT_URI');
    if (!redirectUri) {
      this.logger.error('La variable de entorno REDIRECT_URI no está configurada.');
      throw new Error('REDIRECT_URI no configurada en el .env');
    }

    const updatedConsent = await this.consentService.processAuthCallback(
      code,
      codeVerifier,
      redirectUri,
      consentId,
    );

    return {
      message: 'Autorización completada y tokens guardados.',
      consentStatus: updatedConsent.status,
      accessToken: updatedConsent.accessToken ? 'Guardado' : 'Faltante',
    };
  }
}
