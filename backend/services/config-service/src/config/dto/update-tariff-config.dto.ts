import { PartialType } from '@nestjs/swagger';
import { CreateTariffConfigDto } from './create-tariff-config.dto';

export class UpdateTariffConfigDto extends PartialType(CreateTariffConfigDto) {}
