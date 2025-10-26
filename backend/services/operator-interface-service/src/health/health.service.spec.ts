import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@logistics/database';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let configService: ConfigService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('development'),
    };

    const mockPrismaService = {
      healthCheck: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return health status', async () => {
    const health = await service.getHealthStatus();
    expect(health).toBeDefined();
    expect(health.status).toBe('ok');
    expect(health.service).toBe('Logística API');
    expect(health.version).toBe('1.0.0');
    expect(health.environment).toBe('development');
  });

  it('should include dependencies in health check', async () => {
    const health = await service.getHealthStatus();
    expect(health.dependencies).toBeDefined();
    expect(health.dependencies.database).toBe('healthy');
  });

  it('should handle database health check failure', async () => {
    jest.spyOn(prismaService, 'healthCheck').mockResolvedValue(false);

    const health = await service.getHealthStatus();
    expect(health.status).toBe('unhealthy');
    expect(health.dependencies.database).toBe('unhealthy');
  });
});
