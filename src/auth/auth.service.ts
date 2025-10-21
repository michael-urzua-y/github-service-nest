import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

interface TokenCasResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token: string;
  refresh_token?: string;
  scope: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  private readonly TOKEN_ENDPOINT: string;
  private readonly CLIENT_ID: string;
  private readonly CLIENT_SECRET: string;
  
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // CORRECCIÓN APLICADA: Usamos || para proporcionar un valor predeterminado si la variable es undefined.
    this.TOKEN_ENDPOINT = this.configService.get<string>('AUTH_TOKEN_ENDPOINT') || 'https://authservercert.apisbcp.com/cas/oidc/accessToken';
    
    // Usamos tus valores actuales del .env como fallback por si acaso
    this.CLIENT_ID = this.configService.get<string>('CLIENT_ID') || '3f19f2d3-437b-4b08-8358-045322f7b1a5';
    this.CLIENT_SECRET = this.configService.get<string>('CLIENT_SECRET') || '4046a86b-7bbd-46d4-b76c-97cd5507fb1c';
  }

  async getClientCredentialsToken(): Promise<TokenCasResponse> {
    this.logger.log('Solicitando Client Credentials Token...');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', this.CLIENT_ID);
    params.append('client_secret', this.CLIENT_SECRET);
    params.append('scope', 'accounts');

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.TOKEN_ENDPOINT, params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
      this.logger.log('Client Credentials Token obtenido exitosamente.');
      return response.data as TokenCasResponse;
      
    } catch (error) {
      this.logger.error('Error al obtener Client Credentials Token.', error.stack);
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Credenciales de cliente inválidas.');
      }
      throw error;
    }
  }
  
  async getAuthorizationCodeToken(code: string, codeVerifier: string, redirectUri: string): Promise<TokenCasResponse> {
    this.logger.log('Solicitando Authorization Code Token...');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('client_id', this.CLIENT_ID);
    params.append('code_verifier', codeVerifier);

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.TOKEN_ENDPOINT, params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
      this.logger.log('Authorization Code Token obtenido exitosamente.');
      return response.data as TokenCasResponse;
      
    } catch (error) {
      this.logger.error('Error al obtener Authorization Code Token.', error.stack);
      throw error;
    }
  }
}
