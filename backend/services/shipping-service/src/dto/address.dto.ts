import { IsString, Matches, Length } from 'class-validator';

export class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  @Matches(/^[A-Z]{1}\d{4}[A-Z]{3}$/, {
    message:
      'postal_code must match Argentinian postal code format (e.g., H3500ABC)',
  })
  postal_code: string;

  @IsString()
  @Length(2, 2)
  country: string;
}
