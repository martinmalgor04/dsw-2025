import { Injectable, Logger } from '@nestjs/common';
import { normalizePostalCodeInput } from '@logistics/types';

@Injectable()
export class PostalCodeValidationService {
  private readonly logger = new Logger(PostalCodeValidationService.name);
  private readonly cpaPattern = /^([A-Z]{1}\d{4}[A-Z]{3})$/; // e.g., H3500ABC

  validate(postalCode: string): {
    isValid: boolean;
    formatted?: string;
    numeric?: string;
    errors: string[];
  } {
    const errors: string[] = [];
    if (!postalCode || !postalCode.trim()) {
      return { isValid: false, errors: ['Postal code is required'] };
    }
    const normalized = normalizePostalCodeInput(postalCode);

    if (!normalized || !this.cpaPattern.test(normalized)) {
      errors.push('Invalid postal code format (expected CPA or 4 digits)');
      this.logger.warn(
        `Postal code validation failed for value: ${postalCode}`,
      );
    }

    return {
      isValid: errors.length === 0,
      formatted: errors.length === 0 ? normalized : undefined,
      numeric:
        errors.length === 0 ? normalized?.substring(1, 5) ?? undefined : undefined,
      errors,
    };
  }
}
