import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return service info', () => {
    const serviceInfo = service.getServiceInfo();
    expect(serviceInfo).toBeDefined();
    expect(serviceInfo.service).toBe('Operator Interface Service');
    expect(serviceInfo.version).toBe('1.0.0');
    expect(serviceInfo.description).toBe(
      'Internal APIs for logistics operators frontend',
    );
    expect(serviceInfo.timestamp).toBeDefined();
    expect(serviceInfo.port).toBeDefined();
  });
});
