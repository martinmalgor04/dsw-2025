import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('development'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return health status', async () => {
    const health = await service.getHealthStatus();
    expect(health).toBeDefined();
    expect(health.status).toBe('ok');
    expect(health.service).toBe('Operator Interface Gateway');
    expect(health.version).toBe('1.0.0');
    expect(health.environment).toBe('development');
  });

  it('should always return ok status', async () => {
    const health = await service.getHealthStatus();
    expect(health.status).toBe('ok');
  });

  it('should include note about microservice health checks', async () => {
    const health = await service.getHealthStatus();
    expect(health.note).toBeDefined();
    expect(health.note).toContain('Microservice health checks');
  });
});
