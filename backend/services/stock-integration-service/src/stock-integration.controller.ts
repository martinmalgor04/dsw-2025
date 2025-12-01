import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
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

  @Get('productos')
  @ApiOperation({ summary: 'Listar productos disponibles en Stock API' })
  @ApiResponse({ status: 200, type: [ProductoStockDto] })
  async listProducts(): Promise<ProductoStockDto[]> {
    return this.stockService.listProducts();
  }

  @Get('productos/:id')
  @ApiOperation({ summary: 'Obtener producto por ID del Stock API' })
  @ApiResponse({ status: 200, type: ProductoStockDto })
  async getProduct(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductoStockDto> {
    return this.stockService.getProductById(id);
  }

  @Get('reservas')
  @ApiOperation({
    summary: 'Listar reservas o filtrarlas por usuario/estado/idCompra',
  })
  @ApiResponse({ status: 200, type: [ReservaStockDto] })
  @ApiQuery({
    name: 'usuarioId',
    required: false,
    description: 'Filtra por usuario propietario',
    type: Number,
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Filtra por estado (confirmado|pendiente|cancelado)',
  })
  @ApiQuery({
    name: 'idCompra',
    required: false,
    description:
      'Si además se envía usuarioId, retorna una única reserva que coincida',
  })
  async listReservas(
    @Query('usuarioId') usuarioId?: string,
    @Query('estado') estado?: string,
    @Query('idCompra') idCompra?: string,
  ): Promise<ReservaStockDto[] | ReservaStockDto | null> {
    if (idCompra && typeof usuarioId === 'string') {
      const userId = Number(usuarioId);
      if (Number.isNaN(userId)) {
        throw new BadRequestException('usuarioId debe ser numérico');
      }
      return this.stockService.getReservaByCompraId(idCompra, userId);
    }

    const parsedUserId =
      typeof usuarioId === 'string' && usuarioId.length > 0
        ? Number(usuarioId)
        : undefined;
    if (parsedUserId !== undefined && Number.isNaN(parsedUserId)) {
      throw new BadRequestException('usuarioId debe ser numérico');
    }

    let normalizedEstado: EstadoReserva | undefined;
    if (estado) {
      const lowerEstado = estado.toLowerCase() as EstadoReserva;
      if (
        !Object.values(EstadoReserva).includes(lowerEstado as EstadoReserva)
      ) {
        throw new BadRequestException(
          `estado debe ser uno de: ${Object.values(EstadoReserva).join(', ')}`,
        );
      }
      normalizedEstado = lowerEstado;
    }

    const userIdFilter =
      parsedUserId !== undefined && !Number.isNaN(parsedUserId)
        ? parsedUserId
        : undefined;

    return this.stockService.listReservas({
      usuarioId: userIdFilter,
      estado: normalizedEstado,
      idCompra,
    });
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

