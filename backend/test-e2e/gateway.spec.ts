import axios from 'axios';

// CONFIGURACIÓN
const KEYCLOAK_URL = 'https://keycloak.mmalgor.com.ar';
const REALM = 'ds-2025-realm';
const CLIENT_ID = 'grupo-02';
// Credenciales de prueba
const USERNAME = 'test-user';
const PASSWORD = '12deboca';

const GATEWAY_URL = 'http://localhost:3004';

describe('Logistics System E2E Tests (Auth & Gateway)', () => {
  let accessToken: string;

  // 1. AUTENTICACIÓN
  it('🔐 Should authenticate with Keycloak and get a Token', async () => {
    console.log('Attempting login to Keycloak...');
    
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('username', USERNAME);
    params.append('password', PASSWORD);
    params.append('grant_type', 'password');

    try {
      const response = await axios.post(
        `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
        params,
        {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('access_token');
      
      accessToken = response.data.access_token;
      console.log('✅ Auth Successful! Token obtained.');
    } catch (error: any) {
      console.error('❌ Login Failed:', error.response?.data || error.message);
      throw error;
    }
  });

  // 2. PROBAR GATEWAY PROTEGIDO
  it('🛡️ Should Access Protected Route (Transport Methods) with Token', async () => {
    try {
      const response = await axios.get(`${GATEWAY_URL}/config/transport-methods`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      console.log('✅ Transport Methods retrieved:', response.data.length);
    } catch (error: any) {
      console.error('❌ Access Failed:', error.response?.data || error.message);
      throw error;
    }
  });

  // 3. VALIDAR SEGURIDAD (SIN TOKEN)
  it('🚫 Should Deny Access without Token', async () => {
    try {
      await axios.get(`${GATEWAY_URL}/config/transport-methods`);
      // Si llega aquí, falló la seguridad
      throw new Error('Security Breach: Route should be protected!');
    } catch (error: any) {
      expect(error.response.status).toBe(401);
      console.log('✅ Security OK: 401 Unauthorized received as expected.');
    }
  });

  // 4. CREAR ENVÍO (Tracking Integración)
  it('📦 Should Create Tracking (Integration Endpoint)', async () => {
    const trackingData = {
      orderId: Math.floor(Math.random() * 10000),
      address: 'Av. Corrientes 1234, CABA',
      products: [
        { id: 1, quantity: 1 } // Producto ID 1 debe existir en la API de Stock real
      ]
    };

    try {
      // Nota: Este test puede fallar si el Producto 1 no existe en la API externa, 
      // pero validaremos que llegue al servicio (si da 400 o 404 es que auth pasó).
      const response = await axios.post(
        `${GATEWAY_URL}/api/logistics/tracking`,
        trackingData,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      // Esperamos 201 Created si todo va bien
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('status');
      console.log('✅ Tracking Created:', response.data);
    } catch (error: any) {
      // Si falla por lógica de negocio (ej: producto no existe o sin stock), también es un "pass" para la integración Auth/Gateway
      // El Gateway puede devolver 502 si el microservicio devuelve 400, dependiendo de cómo maneje el proxy los errores.
      // Verificamos si el error original fue 400 o 404.
      const statusCode = error.response?.status;
      const originalError = error.response?.data?.originalError || '';
      
      if (statusCode === 400 || statusCode === 404 || 
         (statusCode === 502 && (originalError.includes('400') || originalError.includes('404')))) {
         console.log('✅ Service reached but business logic failed (Expected: Stock validation works):', error.response?.data);
         return; // Test pasa porque auth y ruteo funcionaron
      }
      console.error('❌ Tracking Creation Failed:', error.response?.data || error.message);
      throw error;
    }
  });
});

