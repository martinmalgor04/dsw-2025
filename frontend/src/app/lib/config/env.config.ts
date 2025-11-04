/**
 * Configuración centralizada de variables de entorno para Next.js
 *
 * IMPORTANTE: Solo usar NEXT_PUBLIC_* para variables que se exponen al cliente
 * Las variables sin NEXT_PUBLIC_ solo están disponibles en el servidor
 */

interface EnvConfig {
  // API Gateway - único endpoint para el frontend
  apiUrl: string;

  // Frontend URL - para redirecciones de autenticación
  frontendUrl: string;

  // Keycloak (opcional)
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
  };

  // Environment info
  env: 'development' | 'production' | 'test';
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Obtiene una variable de entorno con valor por defecto
 */
function getEnvVar(key: string, defaultValue: string = ''): string {
  // En Next.js, las variables NEXT_PUBLIC_* están disponibles en process.env
  const value = process.env[key];

  if (value) {
    return value;
  }

  // Logging importante
  console.warn(`⚠️ Environment variable ${key} is not defined. Using default: "${defaultValue}"`);

  // Si no está definida y estamos en producción, lanzar error
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    console.error(`❌ CRITICAL: Environment variable ${key} is not defined in production!`);
    if (key === 'NEXT_PUBLIC_API_URL') {
      throw new Error(`NEXT_PUBLIC_API_URL must be defined in Dokploy Environment Variables section`);
    }
  }

  return defaultValue;
}

/**
 * Configuración de entorno - Usa las variables compiladas en build time
 * En Next.js, NEXT_PUBLIC_* se reemplazan en build, no en runtime
 */
// Las variables ya están compiladas, simplemente usarlas
const apiUrl = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_API_URL
  : process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl && typeof window !== 'undefined') {
  console.error('❌ FATAL: NEXT_PUBLIC_API_URL is not defined! Check Dokploy Build Environment Variables.');
}

export const envConfig: EnvConfig = {
  // Gateway único - todos los requests van aquí
  // Las variables NEXT_PUBLIC_* se compilan en build time
  apiUrl: apiUrl || 'http://localhost:3004',

  // Frontend URL - para redirecciones de autenticación
  // En browser, se detecta automáticamente. En servidor/test, usar variable
  frontendUrl: typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'),

  // Keycloak config
  keycloak: {
    url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
    realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'ds-2025-realm',
    clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'grupo-02',
  },

  // Environment detection
  env: ((process.env.NEXT_PUBLIC_ENV || 'development') as EnvConfig['env']),
  isDevelopment: (process.env.NEXT_PUBLIC_ENV || 'development') === 'development',
  isProduction: (process.env.NEXT_PUBLIC_ENV || 'development') === 'production',
};

/**
 * Valida que las variables de entorno requeridas estén configuradas
 */
export function validateEnvConfig(): void {
  const required = [
    'NEXT_PUBLIC_API_URL',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(
      `⚠️  Variables de entorno faltantes: ${missing.join(', ')}\n` +
      `Se usarán valores por defecto. Revisa tu archivo .env.local`
    );
  }
}

// Validar en desarrollo
if (envConfig.isDevelopment && typeof window === 'undefined') {
  validateEnvConfig();
}

/**
 * Log de configuración (siempre, para debugging)
 */
if (typeof window !== 'undefined') {
  console.log('🔧 Env Config:', {
    apiUrl: envConfig.apiUrl,
    frontendUrl: envConfig.frontendUrl,
    env: envConfig.env,
    keycloakUrl: envConfig.keycloak.url,
  });
}
