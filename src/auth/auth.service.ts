import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

// Define la estructura básica de la respuesta del token
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
  
  // Endpoints del Authorization Server
  private readonly TOKEN_ENDPOINT: string;
  private readonly CLIENT_ID: string;
  private readonly CLIENT_SECRET: string;
  
  constructor(
  private readonly httpService: HttpService,
  private readonly configService: ConfigService,
  ) {
    this.TOKEN_ENDPOINT = this.configService.get<string>('AUTH_TOKEN_ENDPOINT')!;
    this.CLIENT_ID = this.configService.get<string>('CLIENT_ID')!;
    this.CLIENT_SECRET = this.configService.get<string>('CLIENT_SECRET')!;
  }

  /**
   * Genera un token CAS de tipo Client Credentials (Token de Aplicación).
   * Necesario para crear un Consentimiento.
   * URI: /accessToken (Con Client Credentials en el body)
   */
  async getClientCredentialsToken(): Promise<TokenCasResponse> {
    this.logger.log('Solicitando Client Credentials Token...');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials'); // Tipo de flujo oauth2
    params.append('client_id', this.CLIENT_ID);
    params.append('client_secret', this.CLIENT_SECRET);
    params.append('scope', 'accounts'); // Lista de scopes

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.TOKEN_ENDPOINT, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            // NOTA: Recuerda que los endpoints de auth server requieren Client Certificate
        })
      );
      
      this.logger.log('Client Credentials Token obtenido exitosamente.');
      return response.data as TokenCasResponse;
      
    } catch (error) {
      this.logger.error('Error al obtener Client Credentials Token.', error.stack);
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Credenciales de cliente inválidas (TL0005).'); //
      }
      throw error; 
    }
  }
  
  /**
   * Genera un token CAS de tipo Authorization Code (Token de Cliente).
   * Se llama después de que el usuario autoriza el consentimiento.
   * URI: /accessToken (Con Authorization Code en el body)
   * @param code El código de intercambio.
   * @param codeVerifier El código en texto plano de la verificación (PKCE).
   * @param redirectUri La URL de redireccionamiento.
   */
  async getAuthorizationCodeToken(code: string, codeVerifier: string, redirectUri: string): Promise<TokenCasResponse> {
    this.logger.log('Solicitando Authorization Code Token...');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code'); // Tipo de flujo
    params.append('code', code); // Codigo de intercambio
    params.append('redirect_uri', redirectUri); // URL de redireccionamiento
    params.append('client_id', this.CLIENT_ID);
    params.append('code_verifier', codeVerifier); // Codigo en texto plano de la verificación

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