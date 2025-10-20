import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApiService } from '../api/api.service';
import { AccountService } from './account.service';
import { Account } from './account.entity';

describe('AccountService', () => {
  let service: AccountService;
  let apiService: ApiService;
  let repository; // Repositorio simulado

  // Definir las implementaciones mock (simuladas)
  const mockApiService = {
    get: jest.fn(),
  };

  const mockRepository = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: ApiService,
          useValue: mockApiService,
        },
        {
          provide: getRepositoryToken(Account),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    apiService = module.get<ApiService>(ApiService);
    repository = module.get(getRepositoryToken(Account));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch accounts and save them correctly', async () => {
    // 1. Configurar la respuesta simulada de la API (GET /accounts)
    const mockApiData = {
      Data: {
        Account: [
          { AccountId: '123', Currency: 'PEN', AccountType: 'Cuentas de Ahorro' },
        ],
      },
    };
    mockApiService.get.mockResolvedValue(mockApiData);

    // 2. Configurar la respuesta simulada del guardado en BD
    const expectedSavedAccounts = [{ accountId: '123' } as Account];
    mockRepository.save.mockResolvedValue(expectedSavedAccounts);

    // 3. Ejecutar el método
    const result = await service.fetchAndSaveAccounts('mock-token');

    // 4. Verificar las interacciones
    expect(apiService.get).toHaveBeenCalledWith('/accounts', 'mock-token');
    expect(repository.save).toHaveBeenCalled();
    expect(result).toEqual(expectedSavedAccounts);
  });
});