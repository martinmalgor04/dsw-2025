import { Test, TestingModule } from '@nestjs/testing';
import { PostalCodeValidationService } from './postal-code-validation.service';

describe('PostalCodeValidationService', () => {
  let service: PostalCodeValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostalCodeValidationService],
    }).compile();

    service = module.get<PostalCodeValidationService>(
      PostalCodeValidationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validate', () => {
    it('should validate correct Argentine postal codes', () => {
      const validCodes = [
        'C1000AAA', // CABA
        'B1000AAA', // Buenos Aires
        'X5000ABC', // Córdoba
        'S3000ABC', // Santa Fe
        'M5500ABC', // Mendoza
      ];

      validCodes.forEach((code) => {
        const result = service.validate(code);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid postal codes', () => {
      const invalidCodes = [
        '1234567', // Too short
        'C1000AAAA', // Too long
        'C1000', // Too short
        'C1000AA', // Missing last letter
        'INVALID', // Completely wrong
        '', // Empty
        'C1000A', // Too short
        'C1000AAAAA', // Too long
      ];

      invalidCodes.forEach((code) => {
        const result = service.validate(code);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should validate various postal code formats', () => {
      const validCodes = [
        'C1000AAA', // CABA
        'B1000AAA', // Buenos Aires
        'X5000ABC', // Córdoba
        'S3000ABC', // Santa Fe
        'M5500ABC', // Mendoza
        'H3500ABC', // Chaco
        'T4000ABC', // Tucumán
        'A4400ABC', // Salta
        'Y4600ABC', // Jujuy
      ];

      validCodes.forEach((code) => {
        const result = service.validate(code);
        expect(result.isValid).toBe(true);
        expect(result.formatted).toBe(code);
      });
    });
  });
});
