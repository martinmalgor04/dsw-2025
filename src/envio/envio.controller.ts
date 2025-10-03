import { 
  Controller, 
  Get, 
  Query, 
  BadRequestException, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { EnvioService } from './envio.service';

@ApiTags('envio')
@Controller('envio')
export class EnvioController {
  constructor(private readonly envioService: EnvioService) {}

  @Get('precio')
  @ApiOperation({ 
    summary: 'Calcular precio de envío',
    description: 'Calcula el precio de envío basado en códigos postales, volumen y precio opcional'
  })
  @ApiQuery({ 
    name: 'codigoPostalOrigen', 
    description: 'Código postal de origen', 
    example: '1000',
    required: true 
  })
  @ApiQuery({ 
    name: 'codigoPostalDestino', 
    description: 'Código postal de destino', 
    example: '2000',
    required: true 
  })
  @ApiQuery({ 
    name: 'volumen', 
    description: 'Volumen del envío en metros cúbicos', 
    example: '5',
    required: true 
  })
  @ApiQuery({ 
    name: 'precio', 
    description: 'Precio base del producto (opcional)', 
    example: '15000.50',
    required: false 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Precio de envío calculado exitosamente',
    schema: {
      type: 'object',
      properties: {
        precioCalculado: { type: 'number', example: 2500.75 },
        codigoPostalOrigen: { type: 'string', example: '1000' },
        codigoPostalDestino: { type: 'string', example: '2000' },
        volumen: { type: 'number', example: 5 },
        precio: { type: 'number', example: 15000.50 }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Parámetros inválidos o faltantes',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Los parámetros codigoPostalOrigen, codigoPostalDestino y volumen son requeridos' }
      }
    }
  })
  @ApiResponse({ 
    status: 424, 
    description: 'Destino muy lejos',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Queda muy lejos' }
      }
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Error interno del servidor',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Error interno del servidor' }
      }
    }
  })
  async calcularPrecioEnvio(
    @Query('codigoPostalOrigen') codigoPostalOrigen: string,
    @Query('codigoPostalDestino') codigoPostalDestino: string,
    @Query('volumen') volumen: string,
    @Query('precio') precio?: string,
  ) {
    try {
      // Validar parámetros requeridos
      if (!codigoPostalOrigen || !codigoPostalDestino || !volumen) {
        throw new BadRequestException(
          'Los parámetros codigoPostalOrigen, codigoPostalDestino y volumen son requeridos'
        );
      }

      // Convertir volumen a número
      const volumenNum = parseInt(volumen, 10);
      if (isNaN(volumenNum)) {
        throw new BadRequestException('El volumen debe ser un número válido');
      }

      // Convertir precio a número si se proporciona
      const precioNum = precio ? parseFloat(precio) : undefined;
      if (precio && precioNum !== undefined && isNaN(precioNum)) {
        throw new BadRequestException('El precio debe ser un número válido');
      }

      const precioCalculado = await this.envioService.calcularPrecioEnvio(
        codigoPostalOrigen,
        codigoPostalDestino,
        volumenNum,
        precioNum || undefined,
      );

      return precioCalculado;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Si es el error "Queda muy lejos", devolver 424
      if (error.message === 'Queda muy lejos') {
        throw new HttpException('Queda muy lejos', 424);
      }
      
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
