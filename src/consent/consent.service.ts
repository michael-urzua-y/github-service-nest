import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { ApiService } from 'src/api/api.service';
import { AuthService } from 'src/auth/auth.service';
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
        private consentRepository: Repository<Consent>,
    ) {
        // Validación segura de variables de entorno
        const authServer = this.configService.get<string>('AUTH_SERVER_OPBK_CERT');
        const clientId = this.configService.get<string>('CLIENT_ID');

        if (!authServer) {
            throw new Error('Faltante variable de entorno: AUTH_SERVER_OPBK_CERT');
        }
        if (!clientId) {
            throw new Error('Faltante variable de entorno: CLIENT_ID');
        }

        this.AUTH_SERVER_OPBK_CERT = authServer;
        this.CLIENT_ID = clientId;
    }

    /**
     * Crea la solicitud de consentimiento y genera la URL para autorización.
     */
    async createAuthorizationUrl(
        customerId: string,
        codeChallenge: string,
        redirectUri: string,
        state: string,
        requestJWS: string,
        data: {
            permissions: string[];
            expirationDateTime: string;
            transactionFromDateTime: string;
            transactionToDateTime: string;
        }
    ): Promise<{ consentId: string, authorizationUrl: string }> {

        // 1. Validaciones básicas de parámetros
        if (!customerId || !codeChallenge || !redirectUri || !state || !requestJWS) {
            throw new BadRequestException('Faltan parámetros obligatorios para generar la URL de autorización.');
        }

        const { permissions, expirationDateTime, transactionFromDateTime, transactionToDateTime } = data;

        if (!permissions || permissions.length === 0) {
            throw new BadRequestException('Se deben especificar al menos un permiso en permissions.');
        }
        if (!expirationDateTime || !transactionFromDateTime || !transactionToDateTime) {
            throw new BadRequestException('Faltan fechas necesarias para el consentimiento.');
        }

        // 2. Obtener Token de Aplicación (Client Credentials)
        const appTokenResponse = await this.authService.getClientCredentialsToken();
        const appAccessToken = appTokenResponse.access_token;
        this.logger.log(`Token de aplicación obtenido para crear consentimiento.`);

        // 3. Construir payload dinámico
        const consentPayload: ConsentPayload = {
            Data: {
                Permissions: [permissions], // Mantener array dentro de array si el API lo requiere
                ExpirationDateTime: expirationDateTime,
                TransactionFromDateTime: transactionFromDateTime,
                TransactionToDateTime: transactionToDateTime,
            },
            Risk: {},
        };

        // 4. Llamar a la API para crear el consentimiento
        const apiResponse = await this.apiService.post(
            '/account-access-consents',
            appAccessToken,
            consentPayload,
        );

        const consentId = apiResponse.Data.ConsentId;
        this.logger.log(`ConsentId ${consentId} creado con estado: ${apiResponse.Data.Status}`);

        // 5. Guardar en la BD
        const newConsent = this.consentRepository.create({
            consentId,
            customerId,
            status: apiResponse.Data.Status,
        });
        await this.consentRepository.save(newConsent);

        // 6. Construir la URL de autorización
        const authorizationUrl =
            `${this.AUTH_SERVER_OPBK_CERT}/authorize?` +
            `response_type=code` +
            `&redirect_uri=${redirectUri}` +
            `&state=${state}` +
            `&client_id=${this.CLIENT_ID}` +
            `&scope=accounts` +
            `&code_challenge_method=S256` +
            `&code_challenge=${codeChallenge}` +
            `&request=${requestJWS}`;

        return { consentId, authorizationUrl };
    }

    /**
     * Procesa la redirección del banco, intercambia el código por el token y actualiza la BD.
     */
    async processAuthCallback(
        code: string,
        codeVerifier: string,
        redirectUri: string,
        consentId: string
    ): Promise<Consent> {

        // 1. Obtener Token de Cliente (Authorization Code Token)
        const tokenResponse = await this.authService.getAuthorizationCodeToken(code, codeVerifier, redirectUri);
        this.logger.log(`Token de cliente obtenido para ConsentId: ${consentId}`);

        // 2. Actualizar el Consentimiento en la BD
        const consent = await this.consentRepository.findOne({ where: { consentId } });

        if (!consent) {
            throw new Error(`ConsentId ${consentId} no encontrado en la BD.`);
        }

        consent.accessToken = tokenResponse.access_token;
        consent.refreshToken = tokenResponse.refresh_token ?? undefined; // asignar undefined si es null
        consent.status = 'Authorised';

        return this.consentRepository.save(consent);
    }
}
