/**
 * AuthTypes - Tipos relacionados con autenticación JWT
 */

/**
 * JwtPayload - Estructura de los claims del token JWT
 * Representa los datos decodificados del token de Keycloak
 */
export interface JwtPayload {
  // Subject: ID único del usuario en Keycloak
  sub: string;

  // Usuario preferido en Keycloak
  username: string;

  // Email del usuario
  email?: string;

  // Nombre completo del usuario
  name?: string;

  // Roles asignados al usuario en el realm
  roles: string[];

  // Scopes solicitados en el token
  scopes: string[];

  // ID del cliente que solicitó el token
  clientId: string;

  // Hora de emisión del token (en segundos Unix)
  iat?: number;

  // Hora de expiración del token (en segundos Unix)
  exp?: number;
}

/**
 * Extensión del tipo Request de Express
 * Permite acceder a request.user con el payload JWT
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
