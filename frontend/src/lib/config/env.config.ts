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

  // Si no está definida y estamos en producción, lanzar error
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    console.error(`❌ CRITICAL: Environment variable ${key} is not defined in production!`);
    if (key === 'NEXT_PUBLIC_API_URL') {
      throw new Error(`NEXT_PUBLIC_API_URL must be defined. Got: ${defaultValue}`);
    }
  }

  return defaultValue;
}

/**
 * Configuración de entorno - se evalúa en tiempo de ejecución
 */
export const envConfig: EnvConfig = {
  // Gateway único - todos los requests van aquí
  // ⚠️ DEBE estar definido en variables de entorno
  apiUrl: getEnvVar('NEXT_PUBLIC_API_URL', ''),

  // Frontend URL - para redirecciones de autenticación
  // En browser, se detecta automáticamente. En servidor/test, usar variable
  frontendUrl: typeof window !== 'undefined'
    ? window.location.origin
    : getEnvVar('NEXT_PUBLIC_FRONTEND_URL', 'http://localhost:3000'),

  // Keycloak config
  keycloak: {
    url: getEnvVar('NEXT_PUBLIC_KEYCLOAK_URL', ''),
    realm: getEnvVar('NEXT_PUBLIC_KEYCLOAK_REALM', 'logistica'),
    clientId: getEnvVar('NEXT_PUBLIC_KEYCLOAK_CLIENT_ID', 'logix-frontend'),
  },

  // Environment detection
  env: (getEnvVar('NEXT_PUBLIC_ENV', 'development') as EnvConfig['env']),
  isDevelopment: getEnvVar('NEXT_PUBLIC_ENV', 'development') === 'development',
  isProduction: getEnvVar('NEXT_PUBLIC_ENV', 'development') === 'production',
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
 * Log de configuración (solo en desarrollo)
 */
if (envConfig.isDevelopment && typeof window !== 'undefined') {
  console.log('🔧 Env Config:', {
    apiUrl: envConfig.apiUrl,
    env: envConfig.env,
  });
}
