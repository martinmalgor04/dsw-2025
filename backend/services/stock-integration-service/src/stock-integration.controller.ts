import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StockIntegrationService } from './services/stock-integration.service';
import {
  ProductoStockDto,
  ReservaStockDto,
  CreateReservaDto,
  EstadoReserva,
} from './dto';

@ApiTags('stock')
@Controller('stock')
export class StockIntegrationController {
  constructor(private readonly stockService: StockIntegrationService) {}

  @Get('productos/:id')
  @ApiOperation({ summary: 'Obtener producto por ID del Stock API' })
  @ApiResponse({ status: 200, type: ProductoStockDto })
  async getProduct(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductoStockDto> {
    return this.stockService.getProductById(id);
  }

  @Get('reservas/:idReserva')
  @ApiOperation({ summary: 'Obtener reserva por ID' })
  @ApiResponse({ status: 200, type: ReservaStockDto })
  async getReserva(
    @Param('idReserva', ParseIntPipe) idReserva: number,
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
  ): Promise<ReservaStockDto> {
    const reserva = await this.stockService.getReservaById(
      idReserva,
      usuarioId,
    );
    if (!reserva) {
      throw new NotFoundException(`Reserva ${idReserva} no encontrada`);
    }
    return reserva;
  }

  @Get('reservas')
  @ApiOperation({ summary: 'Buscar reserva por ID de compra' })
  async getReservaByCompra(
    @Query('idCompra') idCompra: string,
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
  ): Promise<ReservaStockDto | null> {
    return this.stockService.getReservaByCompraId(idCompra, usuarioId);
  }

  @Post('reservas')
  @ApiOperation({ summary: 'Crear nueva reserva' })
  @ApiResponse({ status: 201, type: ReservaStockDto })
  async createReserva(
    @Body() createReservaDto: CreateReservaDto,
  ): Promise<ReservaStockDto> {
    return this.stockService.createReserva(createReservaDto);
  }

  @Patch('reservas/:idReserva')
  @ApiOperation({ summary: 'Actualizar estado de reserva' })
  @ApiResponse({ status: 200, type: ReservaStockDto })
  async updateReserva(
    @Param('idReserva', ParseIntPipe) idReserva: number,
    @Body('estado') estado: EstadoReserva,
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
  ): Promise<ReservaStockDto> {
    return this.stockService.updateReservaStatus(idReserva, estado, usuarioId);
  }

  @Delete('reservas/:idReserva')
  @ApiOperation({ summary: 'Cancelar reserva' })
  @ApiResponse({ status: 204 })
  async cancelReserva(
    @Param('idReserva', ParseIntPipe) idReserva: number,
    @Body('motivo') motivo: string,
  ): Promise<void> {
    return this.stockService.cancelReserva(idReserva, motivo);
  }
}

