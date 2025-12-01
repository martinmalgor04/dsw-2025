import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import { envConfig } from '../../config/env.config';

// ============================================================================
// SINGLETON DE KEYCLOAK
// ============================================================================

let keycloakInstance: Keycloak | null = null;

/**
 * Inicializa y retorna la instancia singleton de Keycloak
 * Solo se debe llamar en el cliente (browser)
 */
export function initializeKeycloak(): Keycloak {
  if (keycloakInstance) {
    return keycloakInstance;
  }

  // Verificar que estamos en el cliente
  if (typeof window === 'undefined') {
    throw new Error('Keycloak solo puede inicializarse en el cliente');
  }

  const keycloakUrl = envConfig.keycloak.url;
  const realm = envConfig.keycloak.realm;
  const clientId = envConfig.keycloak.clientId;

  // Validar URL
  if (!keycloakUrl || keycloakUrl === '') {
    console.error(
      '❌ ERROR: NEXT_PUBLIC_KEYCLOAK_URL no está configurada.\n' +
      'Usando valor por defecto: http://localhost:8080'
    );
  }

  const finalKeycloakUrl = keycloakUrl || 'http://localhost:8080';

  console.log('🔧 Creando instancia de Keycloak:', {
    url: finalKeycloakUrl,
    realm: realm,
    clientId: clientId,
  });

  keycloakInstance = new Keycloak({
    url: finalKeycloakUrl,
    realm: realm,
    clientId: clientId,
  });

  return keycloakInstance;
}

/**
 * Obtiene la instancia actual de Keycloak (puede ser null si no está inicializada)
 */
export function getKeycloak(): Keycloak | null {
  return keycloakInstance;
}

/**
 * Resetea la instancia de Keycloak (útil para testing o logout completo)
 */
export function resetKeycloak(): void {
  keycloakInstance = null;
}

// ============================================================================
// OPCIONES DE INICIALIZACIÓN
// ============================================================================

/**
 * Genera las opciones de inicialización de Keycloak
 * Se genera en runtime para asegurar que window esté disponible
 */
export function getKeycloakInitOptions(): KeycloakInitOptions {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  
  return {
    onLoad: 'check-sso',
    pkceMethod: 'S256',
    checkLoginIframe: false,
    enableLogging: process.env.NODE_ENV === 'development',
    silentCheckSsoRedirectUri: `${origin}/silent-check-sso.html`,
    redirectUri: `${origin}/auth/callback`,
  };
}

// Opciones pre-calculadas para compatibilidad
export const keycloakInitOptions: KeycloakInitOptions = typeof window !== 'undefined' 
  ? getKeycloakInitOptions()
  : {
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: false,
      enableLogging: false,
    };

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Verifica si el token actual está próximo a expirar
 */
export function isTokenExpiringSoon(minValidity: number = 30): boolean {
  const kc = getKeycloak();
  if (!kc || !kc.tokenParsed) return true;

  const exp = kc.tokenParsed.exp;
  if (!exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return exp - currentTime < minValidity;
}

/**
 * Obtiene el token actual, refrescándolo si es necesario
 */
export async function getValidToken(minValidity: number = 30): Promise<string | null> {
  const kc = getKeycloak();
  if (!kc) return null;

  try {
    const refreshed = await kc.updateToken(minValidity);
    if (refreshed) {
      console.log('🔄 Token refrescado automáticamente');
    }
    return kc.token || null;
  } catch (error) {
    console.warn('❌ Error obteniendo token válido:', error);
    return null;
  }
}

/**
 * Decodifica el payload del token JWT (sin validar)
 */
export function decodeTokenPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}
