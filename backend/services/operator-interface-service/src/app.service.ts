import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getServiceInfo() {
    return {
      service: 'Operator Interface Service',
      version: '1.0.0',
      description: 'Internal APIs for logistics operators frontend',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 3004,
    };
  }
}
