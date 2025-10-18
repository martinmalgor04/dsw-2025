import { PartialType } from '@nestjs/swagger';
import { CreateCoverageZoneDto } from './create-coverage-zone.dto';

export class UpdateCoverageZoneDto extends PartialType(CreateCoverageZoneDto) {}

