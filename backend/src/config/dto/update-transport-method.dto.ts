import { PartialType } from '@nestjs/swagger';
import { CreateTransportMethodDto } from './create-transport-method.dto';

export class UpdateTransportMethodDto extends PartialType(CreateTransportMethodDto) {}

