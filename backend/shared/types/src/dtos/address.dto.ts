import { Transform } from 'class-transformer';
import { IsString, Matches, Length } from 'class-validator';

const NUMERIC_TO_CPA: Record<string, string> = {
  '1000': 'C1000AAA',
  '1043': 'C1043AAA',
  '2000': 'S2000AAA',
  '5000': 'X5000AAA',
};

const INFERRED_PREFIX_BY_RANGE: Array<{ regex: RegExp; prefix: string }> = [
  { regex: /^1\d{3}$/, prefix: 'C' }, // CABA
  { regex: /^2\d{3}$/, prefix: 'S' }, // Santa Fe
  { regex: /^5\d{3}$/, prefix: 'X' }, // Córdoba
];

export const normalizePostalCodeInput = (value?: string): string | undefined => {
  if (!value) return value;
  const cleaned = value.trim().toUpperCase();
  if (!cleaned) return cleaned;
  if (NUMERIC_TO_CPA[cleaned]) {
    return NUMERIC_TO_CPA[cleaned];
  }
  if (/^\d{4}$/.test(cleaned)) {
    const inferredPrefix =
      INFERRED_PREFIX_BY_RANGE.find(({ regex }) => regex.test(cleaned))
        ?.prefix ?? 'X';
    return `${inferredPrefix}${cleaned}AAA`;
  }
  return cleaned;
};

export class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  @Transform(({ value, obj }) => {
    const raw =
      value ?? obj?.postalCode ?? obj?.postal_code ?? obj?.postalcode ?? '';
    return normalizePostalCodeInput(raw);
  })
  @Matches(/^[A-Z]{1}\d{4}[A-Z]{3}$/, {
    message:
      'postal_code must match Argentinian CPA format (e.g., H3500ABC or inferred from 4-digit code)',
  })
  postal_code: string;

  @IsString()
  @Transform(({ value }) => {
    if (!value) return value;
    const trimmed = value.toString().trim().toUpperCase();
    if (trimmed.length === 2) {
      return trimmed;
    }
    return trimmed.slice(0, 2);
  })
  @Length(2, 2)
  country: string;
}
