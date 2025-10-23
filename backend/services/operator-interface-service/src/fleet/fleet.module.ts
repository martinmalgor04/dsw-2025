import { Module } from '@nestjs/common';
import { PrismaModule } from '@logistics/database';
import { DriversController } from './drivers.controller';
import { DriversService } from './services/drivers.service';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './services/vehicles.service';
import { RoutesController } from './routes.controller';
import { RoutesService } from './services/routes.service';

@Module({
  imports: [PrismaModule],
  controllers: [DriversController, VehiclesController, RoutesController],
  providers: [DriversService, VehiclesService, RoutesService],
})
export class FleetModule {}
