import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CoverageZoneService } from './coverage-zone.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CoverageZoneService', () => {
  let service: CoverageZoneService;
  let prisma: PrismaService;

  const mockPrismaService = {
    coverageZone: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockCoverageZone = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Buenos Aires Capital',
    description: 'Capital Federal y zonas aledañas',
    postalCodes: ['C1000', 'C1001', 'C1002'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoverageZoneService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CoverageZoneService>(CoverageZoneService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debería retornar todas las zonas de cobertura', async () => {
      const mockZones = [mockCoverageZone];
      mockPrismaService.coverageZone.findMany.mockResolvedValue(mockZones);

      const result = await service.findAll();

      expect(result).toEqual(mockZones);
      expect(mockPrismaService.coverageZone.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('debería retornar una zona de cobertura por ID', async () => {
      mockPrismaService.coverageZone.findUnique.mockResolvedValue(mockCoverageZone);

      const result = await service.findOne(mockCoverageZone.id);

      expect(result).toEqual(mockCoverageZone);
      expect(mockPrismaService.coverageZone.findUnique).toHaveBeenCalledWith({
        where: { id: mockCoverageZone.id },
      });
    });

    it('debería lanzar NotFoundException si no encuentra la zona', async () => {
      mockPrismaService.coverageZone.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByPostalCode', () => {
    it('debería retornar zonas que incluyan el código postal especificado', async () => {
      const mockZones = [mockCoverageZone];
      mockPrismaService.coverageZone.findMany.mockResolvedValue(mockZones);

      const result = await service.findByPostalCode('C1000');

      expect(result).toEqual(mockZones);
      expect(mockPrismaService.coverageZone.findMany).toHaveBeenCalledWith({
        where: {
          postalCodes: {
            has: 'C1000',
          },
          isActive: true,
        },
      });
    });

    it('debería retornar array vacío si no encuentra zonas con el código postal', async () => {
      mockPrismaService.coverageZone.findMany.mockResolvedValue([]);

      const result = await service.findByPostalCode('INVALID');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('debería crear una nueva zona de cobertura', async () => {
      const createDto = {
        name: 'Buenos Aires Capital',
        description: 'Capital Federal y zonas aledañas',
        postalCodes: ['C1000', 'C1001', 'C1002'],
        isActive: true,
      };

      mockPrismaService.coverageZone.create.mockResolvedValue(mockCoverageZone);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCoverageZone);
      expect(mockPrismaService.coverageZone.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('update', () => {
    it('debería actualizar una zona de cobertura existente', async () => {
      const updateDto = {
        name: 'Buenos Aires Capital Actualizado',
        postalCodes: ['C1000', 'C1001', 'C1002', 'C1003'],
      };

      const updatedZone = { ...mockCoverageZone, ...updateDto };

      mockPrismaService.coverageZone.findUnique.mockResolvedValue(mockCoverageZone);
      mockPrismaService.coverageZone.update.mockResolvedValue(updatedZone);

      const result = await service.update(mockCoverageZone.id, updateDto);

      expect(result).toEqual(updatedZone);
      expect(mockPrismaService.coverageZone.update).toHaveBeenCalledWith({
        where: { id: mockCoverageZone.id },
        data: updateDto,
      });
    });

    it('debería lanzar NotFoundException si la zona no existe', async () => {
      mockPrismaService.coverageZone.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('debería desactivar una zona de cobertura (soft delete)', async () => {
      const inactiveZone = { ...mockCoverageZone, isActive: false };

      mockPrismaService.coverageZone.findUnique.mockResolvedValue(mockCoverageZone);
      mockPrismaService.coverageZone.update.mockResolvedValue(inactiveZone);

      const result = await service.remove(mockCoverageZone.id);

      expect(result).toEqual(inactiveZone);
      expect(mockPrismaService.coverageZone.update).toHaveBeenCalledWith({
        where: { id: mockCoverageZone.id },
        data: { isActive: false },
      });
    });

    it('debería lanzar NotFoundException si la zona no existe', async () => {
      mockPrismaService.coverageZone.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});

