import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TransportMethodService } from './transport-method.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TransportMethodService', () => {
  let service: TransportMethodService;
  let prisma: PrismaService;

  const mockPrismaService = {
    transportMethod: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockTransportMethod = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    code: 'air',
    name: 'Aéreo',
    description: 'Transporte aéreo para envíos urgentes',
    averageSpeed: 800,
    estimatedDays: '1-3',
    baseCostPerKm: 0.8,
    baseCostPerKg: 5.0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    tariffConfigs: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransportMethodService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TransportMethodService>(TransportMethodService);
    prisma = module.get<PrismaService>(PrismaService);

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debería retornar todos los métodos de transporte', async () => {
      const mockMethods = [mockTransportMethod];
      mockPrismaService.transportMethod.findMany.mockResolvedValue(mockMethods);

      const result = await service.findAll();

      expect(result).toEqual(mockMethods);
      expect(mockPrismaService.transportMethod.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: {
          tariffConfigs: {
            where: { isActive: true },
          },
        },
      });
    });
  });

  describe('findOne', () => {
    it('debería retornar un método de transporte por ID', async () => {
      mockPrismaService.transportMethod.findUnique.mockResolvedValue(mockTransportMethod);

      const result = await service.findOne(mockTransportMethod.id);

      expect(result).toEqual(mockTransportMethod);
      expect(mockPrismaService.transportMethod.findUnique).toHaveBeenCalledWith({
        where: { id: mockTransportMethod.id },
        include: {
          tariffConfigs: {
            where: { isActive: true },
          },
        },
      });
    });

    it('debería lanzar NotFoundException si no encuentra el método', async () => {
      mockPrismaService.transportMethod.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('debería retornar un método de transporte por código', async () => {
      mockPrismaService.transportMethod.findUnique.mockResolvedValue(mockTransportMethod);

      const result = await service.findByCode('air');

      expect(result).toEqual(mockTransportMethod);
      expect(mockPrismaService.transportMethod.findUnique).toHaveBeenCalledWith({
        where: { code: 'air' },
        include: {
          tariffConfigs: {
            where: { isActive: true },
          },
        },
      });
    });

    it('debería lanzar NotFoundException si no encuentra el código', async () => {
      mockPrismaService.transportMethod.findUnique.mockResolvedValue(null);

      await expect(service.findByCode('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('debería crear un nuevo método de transporte', async () => {
      const createDto = {
        code: 'air',
        name: 'Aéreo',
        description: 'Transporte aéreo para envíos urgentes',
        averageSpeed: 800,
        estimatedDays: '1-3',
        baseCostPerKm: 0.8,
        baseCostPerKg: 5.0,
        isActive: true,
      };

      mockPrismaService.transportMethod.findUnique.mockResolvedValue(null);
      mockPrismaService.transportMethod.create.mockResolvedValue(mockTransportMethod);

      const result = await service.create(createDto);

      expect(result).toEqual(mockTransportMethod);
      expect(mockPrismaService.transportMethod.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });

    it('debería lanzar ConflictException si el código ya existe', async () => {
      const createDto = {
        code: 'air',
        name: 'Aéreo',
        averageSpeed: 800,
        estimatedDays: '1-3',
        baseCostPerKm: 0.8,
        baseCostPerKg: 5.0,
      };

      mockPrismaService.transportMethod.findUnique.mockResolvedValue(mockTransportMethod);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('debería actualizar un método de transporte existente', async () => {
      const updateDto = {
        name: 'Aéreo Actualizado',
        averageSpeed: 850,
      };

      const updatedMethod = { ...mockTransportMethod, ...updateDto };

      mockPrismaService.transportMethod.findUnique.mockResolvedValue(mockTransportMethod);
      mockPrismaService.transportMethod.update.mockResolvedValue(updatedMethod);

      const result = await service.update(mockTransportMethod.id, updateDto);

      expect(result).toEqual(updatedMethod);
      expect(mockPrismaService.transportMethod.update).toHaveBeenCalledWith({
        where: { id: mockTransportMethod.id },
        data: updateDto,
      });
    });

    it('debería lanzar NotFoundException si el método no existe', async () => {
      mockPrismaService.transportMethod.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar ConflictException si intenta actualizar a un código existente', async () => {
      const updateDto = { code: 'road' };
      const existingMethod = { ...mockTransportMethod, code: 'road', id: 'other-id' };

      mockPrismaService.transportMethod.findUnique
        .mockResolvedValueOnce(mockTransportMethod) // Primera llamada: verificar que existe
        .mockResolvedValueOnce(existingMethod); // Segunda llamada: verificar código duplicado

      await expect(service.update(mockTransportMethod.id, updateDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('debería desactivar un método de transporte (soft delete)', async () => {
      const inactiveMethod = { ...mockTransportMethod, isActive: false };

      mockPrismaService.transportMethod.findUnique.mockResolvedValue(mockTransportMethod);
      mockPrismaService.transportMethod.update.mockResolvedValue(inactiveMethod);

      const result = await service.remove(mockTransportMethod.id);

      expect(result).toEqual(inactiveMethod);
      expect(mockPrismaService.transportMethod.update).toHaveBeenCalledWith({
        where: { id: mockTransportMethod.id },
        data: { isActive: false },
      });
    });

    it('debería lanzar NotFoundException si el método no existe', async () => {
      mockPrismaService.transportMethod.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});

