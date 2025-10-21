import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PostalCodeValidationService {
  private readonly logger = new Logger(PostalCodeValidationService.name);
  private readonly cpaPattern = /^([A-Z]{1}\d{4}[A-Z]{3})$/; // e.g., H3500ABC

  validate(postalCode: string): { isValid: boolean; formatted?: string; errors: string[] } {
    const errors: string[] = [];
    if (!postalCode || !postalCode.trim()) {
      return { isValid: false, errors: ['Postal code is required'] };
    }
    const cleaned = postalCode.trim().toUpperCase();
    if (cleaned.length !== 8) errors.push('Postal code must be exactly 8 characters');
    if (!this.cpaPattern.test(cleaned)) errors.push('Invalid CPA format (e.g., H3500ABC)');
    return { isValid: errors.length === 0, formatted: cleaned, errors };
  }
}


