import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ItemsService } from './items.service';

@ApiTags('items')
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Obtener todos los items',
    description: 'Retorna la lista completa de items/productos disponibles'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de items obtenida exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Laptop Gaming' },
          description: { type: 'string', example: 'Laptop para gaming de alta gama' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Error interno del servidor',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Error al obtener la lista de items' }
      }
    }
  })
  async findAll() {
    try {
      const items = await this.itemsService.findAll();
      return items;
    } catch (error) {
      throw new HttpException(
        'Error al obtener la lista de items',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
