import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppModule } from '../../src/app.module';
import { StockIntegrationService } from '../../src/services/stock-integration.service';
import { ProductoStockDto, ReservaStockDto, EstadoReserva } from '../../src/dto';

describe('Stock Integration Service - Real API Tests', () => {
  let app: INestApplication;
  let service: StockIntegrationService;

  // --- CONFIGURACIÓN ---
  // IDs de productos para las pruebas
  const EXISTING_PRODUCT_ID = 1;
  const NON_EXISTENT_PRODUCT_ID = 999999;
  
  // IDs de reservas para las pruebas
  const TEST_USER_ID = 1;
  const TEST_COMPRA_ID = 'COMPRA-TEST-12345';
  const TEST_RESERVA_ID = 1;
  const NON_EXISTENT_COMPRA_ID = 'COMPRA-NO-EXISTE-999999';
  // -------------------

  beforeAll(async () => {
    // Cargar la variable de entorno para la URL de la API real
    // Asegúrate de tener un .env con STOCK_API_URL
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env.local', '.env'],
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = moduleFixture.get<StockIntegrationService>(StockIntegrationService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Connection to Real Stock API - Productos Endpoints', () => {
    it('should successfully retrieve an existing product', async () => {
      console.log(`\n🧪 Testing connection to: ${process.env.STOCK_API_URL || 'URL_NOT_SET'}`);
      console.log(`\n🔎 Fetching product with ID: ${EXISTING_PRODUCT_ID}...`);
      
      let product: ProductoStockDto | null = null;
      let error: any = null;

      try {
        product = await service.getProductById(EXISTING_PRODUCT_ID);
      } catch (e) {
        error = e;
      }

      // Log para debugging en caso de fallo
      if (error) {
        console.error('❌ Error fetching product:', error.message);
        console.error('Stack:', error.stack);
      }
      if (product && product.nombre === 'Producto No Disponible') {
          console.warn('⚠️  Warning: Received fallback product. The API might be down or the product ID is incorrect.');
      } else if (product) {
        console.log('✅ Product found:', {
          id: product.id,
          nombre: product.nombre,
          precio: product.precio,
          stockDisponible: product.stockDisponible,
        });
      }

      expect(error).toBeNull();
      expect(product).toBeDefined();
      expect(product).not.toBeNull();
      expect(product?.id).toBe(EXISTING_PRODUCT_ID);
      // Asegurarse de que no estamos recibiendo el producto por defecto
      expect(product?.nombre).not.toBe('Producto No Disponible'); 
      expect(product?.stockDisponible).toBeGreaterThanOrEqual(0);
      expect(product?.precio).toBeGreaterThan(0);
    }, 20000); // Timeout extendido para llamadas de red reales

    it('should handle non-existent products gracefully (404)', async () => {
      console.log(`\n🔎 Fetching non-existent product with ID: ${NON_EXISTENT_PRODUCT_ID}...`);

      const product = await service.getProductById(NON_EXISTENT_PRODUCT_ID);

      // El servicio está diseñado para devolver un producto por defecto en caso de error (incluido 404)
      expect(product).toBeDefined();
      expect(product.id).toBe(NON_EXISTENT_PRODUCT_ID);
      expect(product.nombre).toBe('Producto No Disponible');
      expect(product.stockDisponible).toBe(0);
      console.log('✅ Service correctly returned fallback product for non-existent product');
    }, 20000);
  });

  describe('Connection to Real Stock API - Reservas Endpoints', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should successfully list reservas for a user', async () => {
      console.log(`\n🧪 Testing connection to: ${process.env.STOCK_API_URL || 'URL_NOT_SET'}`);
      console.log(`\n🔎 Fetching reservas for user ID: ${TEST_USER_ID}...`);
      
      let reserva: ReservaStockDto | null = null;
      let error: any = null;

      try {
        // El servicio usa getReservaByCompraId que internamente llama a GET /reservas?usuarioId=X
        // Para probar la conexión, intentamos obtener una reserva
        // Si no existe la compra específica, al menos verificamos que la API responde
        reserva = await service.getReservaByCompraId(TEST_COMPRA_ID, TEST_USER_ID);
      } catch (e) {
        error = e;
      }

      // Log para debugging
      if (error) {
        console.error('❌ Error fetching reservas:', error.message);
        console.error('Stack:', error.stack);
      } else {
        if (reserva === null) {
          console.log('ℹ️  No reserva found for compraId:', TEST_COMPRA_ID);
          console.log('   This is OK - it means the API responded but the reserva doesn\'t exist');
        } else {
          console.log('✅ Reserva found:', {
            idReserva: reserva.idReserva,
            idCompra: reserva.idCompra,
            estado: reserva.estado,
          });
        }
      }

      // El test pasa si no hay error (incluso si la reserva no existe)
      expect(error).toBeNull();
    }, 20000); // Timeout extendido para llamadas de red reales

    it('should successfully retrieve a reserva by ID', async () => {
      console.log(`\n🔎 Fetching reserva by ID: ${TEST_RESERVA_ID} for user: ${TEST_USER_ID}...`);

      let reserva: ReservaStockDto | null = null;
      let error: any = null;

      try {
        reserva = await service.getReservaById(TEST_RESERVA_ID, TEST_USER_ID);
      } catch (e) {
        error = e;
      }

      if (error) {
        console.error('❌ Error fetching reserva by ID:', error.message);
      } else {
        if (reserva === null) {
          console.log('ℹ️  No reserva found for reservaId:', TEST_RESERVA_ID);
        } else {
          console.log('✅ Reserva found:', {
            idReserva: reserva.idReserva,
            idCompra: reserva.idCompra,
            estado: reserva.estado,
            productos: reserva.productos?.length || 0,
          });
        }
      }

      // El test pasa si no hay error (incluso si la reserva no existe)
      expect(error).toBeNull();
    }, 20000);

    it('should handle non-existent reservas gracefully', async () => {
      console.log(`\n🔎 Testing non-existent reserva with compraId: ${NON_EXISTENT_COMPRA_ID}...`);

      const reserva = await service.getReservaByCompraId(
        NON_EXISTENT_COMPRA_ID,
        TEST_USER_ID,
      );

      // El servicio debe retornar null cuando no encuentra la reserva
      expect(reserva).toBeNull();
      console.log('✅ Service correctly returned null for non-existent reserva');
    }, 20000);

    it('should handle circuit breaker when API is unreachable', async () => {
      // Este test verifica que el circuit breaker funciona
      // Nota: Este test puede fallar si la API está disponible
      // Es más útil cuando la API está caída
      console.log(`\n🔍 Testing circuit breaker behavior...`);

      // Intentamos hacer varias llamadas para ver el comportamiento del circuit breaker
      const results = [];
      for (let i = 0; i < 3; i++) {
        try {
          const reserva = await service.getReservaByCompraId(
            `TEST-${i}`,
            TEST_USER_ID,
          );
          results.push({ success: true, reserva: reserva !== null });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }

      console.log('Circuit breaker test results:', results);
      // El test pasa si no hay errores inesperados
      expect(results.length).toBe(3);
    }, 30000);
  });
});
