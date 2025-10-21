import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiService {
  private readonly logger = new Logger(ApiService.name);
  
  private readonly API_BASE_URL: string;
  private readonly SUBSCRIPTION_KEY: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // CORRECCIÓN APLICADA: Usamos || para asegurar el tipo string y proporcionar un fallback.
    this.API_BASE_URL = this.configService.get<string>('API_BASE_URL') || 'https://openbanking-cert.apisbcp.com/account-information/v1';
    this.SUBSCRIPTION_KEY = this.configService.get<string>('SUBSCRIPTION_KEY') || 'default-subscription-key';
  }

  private getHeaders(accessToken: string, customHeaders?: Record<string, string>): Record<string, string> {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'subscription-key': this.SUBSCRIPTION_KEY,
      'Content-Type': 'application/json; charset=utf-8',
      ...customHeaders,
    };
  }

  async get(path: string, accessToken: string, config?: AxiosRequestConfig): Promise<any> {
    const url = `${this.API_BASE_URL}${path}`;
    const headers = this.getHeaders(accessToken, config?.headers as Record<string, string>);
    
    this.logger.log(`GET: ${url}`);
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { ...config, headers }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Error en GET ${url}: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  async post(path: string, accessToken: string, data: any, config?: AxiosRequestConfig): Promise<any> {
    const url = `${this.API_BASE_URL}${path}`;
    const headers = this.getHeaders(accessToken, config?.headers as Record<string, string>);
    
    this.logger.log(`POST: ${url}`);
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data, { ...config, headers }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Error en POST ${url}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
