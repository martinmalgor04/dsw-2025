import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransportMethodsService } from './transport-methods.service';
import { TransportMethodsResponseDto } from './dto/transport-methods.dto';

@ApiTags('🚛 Logística - Métodos de Transporte')
@Controller('transport-methods')
export class TransportMethodsController {
  constructor(
    private readonly transportMethodsService: TransportMethodsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: '🚛 Obtener métodos de transporte',
    description: 'Obtiene la lista de métodos de transporte disponibles con sus tiempos estimados'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de métodos de transporte obtenida exitosamente',
    type: TransportMethodsResponseDto
  })
  async getTransportMethods(): Promise<TransportMethodsResponseDto> {
    return this.transportMethodsService.getTransportMethods();
  }
}

