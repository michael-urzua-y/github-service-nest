import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiService } from 'src/api/api.service';
import { AuthService } from 'src/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { Consent } from './consent.entity';

interface ConsentPayload {
  Data: {
    Permissions: string[][];
    ExpirationDateTime: string;
    TransactionFromDateTime: string;
    TransactionToDateTime: string;
  };
  Risk: Record<string, any>;
}

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);
  private readonly AUTH_SERVER_OPBK_CERT: string;
  private readonly CLIENT_ID: string;

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    @InjectRepository(Consent)
    private readonly consentRepository: Repository<Consent>,
  ) {
    this.AUTH_SERVER_OPBK_CERT = this.configService.get<string>('AUTH_SERVER_OPBK_CERT')!;
    this.CLIENT_ID = this.configService.get<string>('CLIENT_ID')!;
  }

  async createAuthorizationUrl(
    customerId: string,
    codeChallenge: string,
    redirectUri: string,
    state: string,
    requestJWS: string,
    data: { permissions: string[]; expirationDateTime: string; transactionFromDateTime: string; transactionToDateTime: string }
  ): Promise<{ consentId: string; authorizationUrl: string }> {

    if (!customerId || !codeChallenge || !redirectUri || !state || !requestJWS) {
      throw new BadRequestException('Faltan parámetros obligatorios.');
    }

    const { permissions, expirationDateTime, transactionFromDateTime, transactionToDateTime } = data;
    if (!permissions.length || !expirationDateTime || !transactionFromDateTime || !transactionToDateTime) {
      throw new BadRequestException('Faltan campos necesarios en payload.');
    }

    const appToken = await this.authService.getClientCredentialsToken();
    const consentPayload: ConsentPayload = {
      Data: { Permissions: [permissions], ExpirationDateTime: expirationDateTime, TransactionFromDateTime: transactionFromDateTime, TransactionToDateTime: transactionToDateTime },
      Risk: {},
    };

    const apiResponse = await this.apiService.post('/account-access-consents', appToken.access_token, consentPayload);
    const consentId = apiResponse.Data.ConsentId;

    const newConsent = this.consentRepository.create({ consentId, customerId, status: apiResponse.Data.Status });
    await this.consentRepository.save(newConsent);

    const authorizationUrl =
      `${this.AUTH_SERVER_OPBK_CERT}/authorize?response_type=code&redirect_uri=${redirectUri}&state=${state}&client_id=${this.CLIENT_ID}&scope=accounts&code_challenge_method=S256&code_challenge=${codeChallenge}&request=${requestJWS}`;

    return { consentId, authorizationUrl };
  }

  async processAuthCallback(code: string, codeVerifier: string, redirectUri: string, consentId: string): Promise<Consent> {
    const tokenResponse = await this.authService.getAuthorizationCodeToken(code, codeVerifier, redirectUri);
    const consent = await this.consentRepository.findOne({ where: { consentId } });
    if (!consent) throw new Error(`ConsentId ${consentId} no encontrado.`);

    consent.accessToken = tokenResponse.access_token;
    consent.refreshToken = tokenResponse.refresh_token ?? undefined;
    consent.status = 'Authorised';
    return this.consentRepository.save(consent);
  }
}
