import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import {
  CalculateCostRequestDto,
  CalculateCostResponseDto,
} from './dto/calculate-cost.dto';
import {
  CreateShippingRequestDto,
  CreateShippingResponseDto,
} from './dto/create-shipping.dto';
import {
  ShippingDetailDto,
  ListShippingResponseDto,
  CancelShippingResponseDto,
} from './dto/shipping-responses.dto';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('cost')
  @HttpCode(HttpStatus.OK)
  async calculateCost(
    @Body() body: CalculateCostRequestDto,
  ): Promise<CalculateCostResponseDto> {
    return this.shippingService.calculateCost(body);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createShipping(
    @Body() body: CreateShippingRequestDto,
  ): Promise<CreateShippingResponseDto> {
    return this.shippingService.createShipping(body);
  }

  @Get()
  async listShipments(
    @Query('user_id') userId?: number,
    @Query('status') status?: string,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<ListShippingResponseDto> {
    return this.shippingService.listShipments({
      userId,
      status,
      fromDate,
      toDate,
      page,
      limit,
    });
  }

  @Get(':id')
  async getShippingDetail(
    @Param('id') id: string,
  ): Promise<ShippingDetailDto> {
    return this.shippingService.getShippingDetail(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelShipping(
    @Param('id') id: string,
  ): Promise<CancelShippingResponseDto> {
    return this.shippingService.cancelShipping(id);
  }
}

