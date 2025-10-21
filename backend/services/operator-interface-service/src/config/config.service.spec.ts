import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@logistics/database';
import { LoggerService } from '@logistics/utils';
import { ConfigService as CustomConfigService } from './config.service';

describe('ConfigService', () => {
  let service: CustomConfigService;
  let configService: ConfigService;
  let httpService: HttpService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('http://localhost:3003'),
    };

    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
    };

    const mockPrismaService = {
      transportMethod: {
        findMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      coverageZone: {
        findMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockLoggerService = {
      startOperation: jest.fn(),
      endOperation: jest.fn(),
      errorWithContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<CustomConfigService>(CustomConfigService);
    configService = module.get<ConfigService>(ConfigService);
    httpService = module.get<HttpService>(HttpService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get all transport methods', async () => {
    const mockMethods = [
      { 
        id: '1', 
        code: 'ROAD', 
        name: 'Road Transport',
        description: 'Road transport method',
        averageSpeed: 60,
        estimatedDays: '2-3',
        baseCostPerKm: 0.5,
        baseCostPerKg: 1.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        tariffConfigs: []
      },
    ];
    
    jest.spyOn(prismaService.transportMethod, 'findMany').mockResolvedValue(mockMethods as any);

    const result = await service.getAllTransportMethods();
    expect(result).toEqual(mockMethods);
    expect(prismaService.transportMethod.findMany).toHaveBeenCalled();
  });

  it('should get transport method by id', async () => {
    const mockMethod = { 
      id: '1', 
      code: 'ROAD', 
      name: 'Road Transport',
      description: 'Road transport method',
      averageSpeed: 60,
      estimatedDays: '2-3',
      baseCostPerKm: 0.5,
      baseCostPerKg: 1.0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      tariffConfigs: []
    };
    
    jest.spyOn(prismaService.transportMethod, 'findUniqueOrThrow').mockResolvedValue(mockMethod as any);

    const result = await service.getTransportMethodById('1');
    expect(result).toEqual(mockMethod);
    expect(prismaService.transportMethod.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: '1' },
      include: { tariffConfigs: { where: { isActive: true } } },
    });
  });

  it('should get all coverage zones', async () => {
    const mockZones = [
      { 
        id: '1', 
        name: 'Buenos Aires', 
        description: 'Buenos Aires coverage zone',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        postalCodes: ['C1000AAA'] 
      },
    ];
    
    jest.spyOn(prismaService.coverageZone, 'findMany').mockResolvedValue(mockZones as any);

    const result = await service.getAllCoverageZones();
    expect(result).toEqual(mockZones);
    expect(prismaService.coverageZone.findMany).toHaveBeenCalled();
  });
});
