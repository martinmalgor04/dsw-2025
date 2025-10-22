# 🔐 Integración con Keycloak - RF-007 Extension

## 📋 Información General

| Aspecto | Detalle |
|---------|---------|
| **Sistema** | Keycloak |
| **Propósito** | Autenticación y Autorización centralizada |
| **Protocolo** | OAuth 2.0 / OpenID Connect |
| **Token Type** | JWT (JSON Web Token) |
| **Grant Type** | Authorization Code with PKCE |

---

## 🏗️ Arquitectura de Autenticación

### Flujo de Autenticación con Keycloak

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│                                                          │
│  1. User clicks "Login"                                 │
│  2. Redirect to Keycloak                                │
└──────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Keycloak Server                       │
│                                                          │
│  3. User enters credentials                             │
│  4. Validate credentials                                │
│  5. Generate JWT tokens                                 │
│  6. Redirect back with auth code                        │
└──────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│                                                          │
│  7. Exchange code for tokens                            │
│  8. Store tokens (AuthStore)                            │
│  9. Include token in API calls                          │
└──────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                Backend Microservices                     │
│                                                          │
│  10. Validate JWT with Keycloak public key              │
│  11. Extract user roles/permissions                     │
│  12. Process request                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuración de Keycloak

### 1. **Realm Configuration**

```json
{
  "realm": "logistica",
  "enabled": true,
  "displayName": "LogiX - Sistema de Logística",
  "loginTheme": "logix-theme",
  "sslRequired": "external",
  "registrationAllowed": false,
  "resetPasswordAllowed": true,
  "rememberMe": true,
  "verifyEmail": false,
  "accessTokenLifespan": 900,        // 15 minutos
  "ssoSessionIdleTimeout": 1800,     // 30 minutos
  "ssoSessionMaxLifespan": 36000     // 10 horas
}
```

### 2. **Client Configuration**

```json
{
  "clientId": "logix-frontend",
  "name": "LogiX Frontend Application",
  "protocol": "openid-connect",
  "publicClient": true,
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": false,
  "serviceAccountsEnabled": false,
  "authorizationServicesEnabled": false,
  "redirectUris": [
    "http://localhost:3000/*",
    "https://logix.example.com/*"
  ],
  "webOrigins": [
    "http://localhost:3000",
    "https://logix.example.com"
  ],
  "attributes": {
    "pkce.code.challenge.method": "S256",
    "use.refresh.tokens": "true",
    "client.session.idle.timeout": "1800",
    "client.session.max.lifespan": "36000"
  }
}
```

### 3. **Roles & Permissions**

```yaml
Realm Roles:
  - admin
  - operator
  - viewer
  - driver

Client Roles (logix-frontend):
  - shipment:create
  - shipment:read
  - shipment:update
  - shipment:delete
  - config:manage
  - vehicle:manage
  - driver:manage
  - route:manage
  - report:view
  - report:export
```

### 4. **User Attributes**

```json
{
  "attributes": {
    "employeeId": "EMP001",
    "department": "logistics",
    "zone": "buenos-aires",
    "phoneNumber": "+54-11-1234-5678"
  }
}
```

---

## 📦 Frontend: AuthService con Keycloak

### **Instalación de Dependencias**

```bash
npm install keycloak-js @react-keycloak/web
```

### **Configuración de Keycloak** (`keycloak.config.ts`)

```typescript
import Keycloak from 'keycloak-js';

// Configuración de Keycloak
export const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'logistica',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'logix-frontend',
};

// Instancia de Keycloak
export const keycloak = new Keycloak(keycloakConfig);

// Opciones de inicialización
export const keycloakInitOptions = {
  onLoad: 'check-sso',
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
  pkceMethod: 'S256',
  checkLoginIframe: false,
  enableLogging: process.env.NODE_ENV === 'development',
};
```

### **AuthService Actualizado** (`auth.service.ts`)

```typescript
import { keycloak } from './keycloak.config';

export class AuthService {
  private static instance: AuthService;
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Inicializar Keycloak
   */
  async init(): Promise<boolean> {
    try {
      const authenticated = await keycloak.init(keycloakInitOptions);
      
      if (authenticated) {
        console.log('User is authenticated');
        await this.loadUserProfile();
        this.setupTokenRefresh();
      }
      
      return authenticated;
    } catch (error) {
      console.error('Keycloak init failed', error);
      return false;
    }
  }

  /**
   * Login con Keycloak
   */
  async login(redirectUri?: string): Promise<void> {
    await keycloak.login({
      redirectUri: redirectUri || window.location.origin,
    });
  }

  /**
   * Logout
   */
  async logout(redirectUri?: string): Promise<void> {
    await keycloak.logout({
      redirectUri: redirectUri || window.location.origin,
    });
  }

  /**
   * Obtener token actual
   */
  getToken(): string | undefined {
    return keycloak.token;
  }

  /**
   * Obtener refresh token
   */
  getRefreshToken(): string | undefined {
    return keycloak.refreshToken;
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return !!keycloak.authenticated;
  }

  /**
   * Obtener perfil del usuario
   */
  async getUserProfile(): Promise<Keycloak.KeycloakProfile | undefined> {
    if (keycloak.authenticated) {
      return await keycloak.loadUserProfile();
    }
    return undefined;
  }

  /**
   * Obtener roles del usuario
   */
  getUserRoles(): string[] {
    if (!keycloak.tokenParsed) return [];
    
    const realmRoles = keycloak.tokenParsed.realm_access?.roles || [];
    const clientRoles = keycloak.tokenParsed.resource_access?.['logix-frontend']?.roles || [];
    
    return [...realmRoles, ...clientRoles];
  }

  /**
   * Verificar si tiene un rol específico
   */
  hasRole(role: string): boolean {
    return keycloak.hasRealmRole(role) || 
           keycloak.hasResourceRole(role, 'logix-frontend');
  }

  /**
   * Verificar múltiples roles (OR)
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Verificar múltiples roles (AND)
   */
  hasAllRoles(roles: string[]): boolean {
    return roles.every(role => this.hasRole(role));
  }

  /**
   * Refresh token manualmente
   */
  async refreshToken(minValidity = 30): Promise<boolean> {
    try {
      const refreshed = await keycloak.updateToken(minValidity);
      if (refreshed) {
        console.log('Token refreshed successfully');
      }
      return refreshed;
    } catch (error) {
      console.error('Failed to refresh token', error);
      await this.logout();
      return false;
    }
  }

  /**
   * Setup auto-refresh de token
   */
  private setupTokenRefresh(): void {
    // Refresh token 60 segundos antes de expirar
    keycloak.onTokenExpired = async () => {
      console.log('Token expired, refreshing...');
      await this.refreshToken(60);
    };

    // Auto-refresh cada 4 minutos
    setInterval(async () => {
      await this.refreshToken(240);
    }, 4 * 60 * 1000);
  }

  /**
   * Cargar perfil de usuario
   */
  private async loadUserProfile(): Promise<void> {
    try {
      const profile = await keycloak.loadUserProfile();
      console.log('User profile loaded', profile);
      
      // Guardar en AuthStore
      authStore.setUser({
        id: keycloak.tokenParsed?.sub,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        username: profile.username,
        roles: this.getUserRoles(),
        attributes: keycloak.tokenParsed?.attributes,
      });
    } catch (error) {
      console.error('Failed to load user profile', error);
    }
  }

  /**
   * Obtener headers para requests HTTP
   */
  getAuthHeaders(): Record<string, string> {
    if (!keycloak.token) return {};
    
    return {
      'Authorization': `Bearer ${keycloak.token}`,
    };
  }
}

export const authService = AuthService.getInstance();
```

### **HTTP Client con Keycloak** (`http-client.ts`)

```typescript
import axios, { AxiosInstance } from 'axios';
import { authService } from './auth.service';

class HttpClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request Interceptor - Agregar token
    this.client.interceptors.request.use(
      async (config) => {
        // Verificar si el token necesita refresh
        const isAuthenticated = authService.isAuthenticated();
        
        if (isAuthenticated) {
          // Refresh si expira en menos de 60 segundos
          await authService.refreshToken(60);
          
          // Agregar token al header
          const token = authService.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor - Manejar 401
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Si es 401 y no hemos intentado refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Intentar refresh
            const refreshed = await authService.refreshToken();
            
            if (refreshed) {
              // Reintentar request original
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh falló, hacer logout
            await authService.logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Métodos HTTP...
  get<T>(url: string, config?: any) {
    return this.client.get<T>(url, config);
  }

  post<T>(url: string, data: any, config?: any) {
    return this.client.post<T>(url, data, config);
  }

  patch<T>(url: string, data: any, config?: any) {
    return this.client.patch<T>(url, data, config);
  }

  delete<T>(url: string, config?: any) {
    return this.client.delete<T>(url, config);
  }
}

export const httpClient = new HttpClient();
```

### **React Provider con Keycloak** (`KeycloakProvider.tsx`)

```tsx
import React, { useEffect, useState } from 'react';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import { keycloak } from './keycloak.config';
import { authService } from './auth.service';

interface KeycloakProviderProps {
  children: React.ReactNode;
}

export const KeycloakProvider: React.FC<KeycloakProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  const onKeycloakEvent = (event: string, error?: any) => {
    console.log('Keycloak event:', event, error);
    
    switch (event) {
      case 'onAuthSuccess':
        console.log('Authentication successful');
        break;
      case 'onAuthError':
        console.error('Authentication error', error);
        break;
      case 'onAuthRefreshSuccess':
        console.log('Token refresh successful');
        break;
      case 'onAuthRefreshError':
        console.error('Token refresh error', error);
        break;
      case 'onAuthLogout':
        console.log('User logged out');
        break;
    }
  };

  const onKeycloakTokens = (tokens: any) => {
    console.log('Keycloak tokens updated');
    
    // Actualizar AuthStore con nuevos tokens
    if (tokens.token) {
      authStore.setToken(tokens.token);
    }
  };

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      }}
      onEvent={onKeycloakEvent}
      onTokens={onKeycloakTokens}
      LoadingComponent={
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Verificando autenticación...</div>
        </div>
      }
    >
      {children}
    </ReactKeycloakProvider>
  );
};
```

### **Hook useAuth con Keycloak** (`useAuth.ts`)

```typescript
import { useKeycloak } from '@react-keycloak/web';
import { useEffect, useState } from 'react';

interface User {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  roles: string[];
  attributes?: Record<string, any>;
}

export const useAuth = () => {
  const { keycloak, initialized } = useKeycloak();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (initialized && keycloak.authenticated) {
        try {
          const profile = await keycloak.loadUserProfile();
          
          const userData: User = {
            id: keycloak.tokenParsed?.sub,
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            username: profile.username,
            roles: [
              ...(keycloak.tokenParsed?.realm_access?.roles || []),
              ...(keycloak.tokenParsed?.resource_access?.['logix-frontend']?.roles || []),
            ],
            attributes: keycloak.tokenParsed?.attributes,
          };
          
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user profile', error);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [initialized, keycloak]);

  const login = () => keycloak.login();
  
  const logout = () => keycloak.logout();
  
  const hasRole = (role: string): boolean => {
    return keycloak.hasRealmRole(role) || 
           keycloak.hasResourceRole(role, 'logix-frontend');
  };
  
  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };
  
  const hasAllRoles = (roles: string[]): boolean => {
    return roles.every(role => hasRole(role));
  };

  return {
    user,
    loading,
    isAuthenticated: !!keycloak.authenticated,
    initialized,
    token: keycloak.token,
    login,
    logout,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    keycloak,
  };
};
```

### **Protected Route Component** (`ProtectedRoute.tsx`)

```tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  requireAll?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  roles = [], 
  requireAll = false 
}) => {
  const { isAuthenticated, loading, hasAnyRole, hasAllRoles } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0) {
    const hasPermission = requireAll 
      ? hasAllRoles(roles) 
      : hasAnyRole(roles);
    
    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
```

---

## 🔧 Backend: Validación de JWT con Keycloak

### **Instalación de Dependencias (NestJS)**

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt jwks-rsa
```

### **Keycloak Strategy** (`keycloak.strategy.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get('KEYCLOAK_URL')}/realms/${configService.get('KEYCLOAK_REALM')}/protocol/openid-connect/certs`,
      }),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      username: payload.preferred_username,
      email: payload.email,
      roles: [
        ...(payload.realm_access?.roles || []),
        ...(payload.resource_access?.['logix-frontend']?.roles || []),
      ],
      attributes: payload.attributes,
    };
  }
}
```

### **Auth Guard** (`keycloak-auth.guard.ts`)

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class KeycloakAuthGuard extends AuthGuard('keycloak') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Primero verificar autenticación
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) return false;

    // Luego verificar roles si están definidos
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.some(role => user.roles?.includes(role));
  }
}
```

### **Roles Decorator** (`roles.decorator.ts`)

```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

### **Uso en Controllers**

```typescript
@Controller('shipments')
@UseGuards(KeycloakAuthGuard)
export class ShipmentsController {
  
  @Get()
  @Roles('shipment:read')
  async findAll() {
    // Solo usuarios con rol shipment:read
  }

  @Post()
  @Roles('shipment:create')
  async create(@Body() dto: CreateShipmentDto) {
    // Solo usuarios con rol shipment:create
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string) {
    // Solo admins pueden eliminar
  }
}
```

---

## 📝 Variables de Entorno

### **Frontend (.env)**

```env
# Keycloak Configuration
REACT_APP_KEYCLOAK_URL=http://localhost:8080
REACT_APP_KEYCLOAK_REALM=logistica
REACT_APP_KEYCLOAK_CLIENT_ID=logix-frontend

# API Configuration
REACT_APP_API_URL=http://localhost:3004
```

### **Backend (.env)**

```env
# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=logistica
KEYCLOAK_CLIENT_ID=logix-backend
KEYCLOAK_CLIENT_SECRET=your-client-secret-here
```

---

## 🧪 Testing con Keycloak

### **Mock de Keycloak para Tests**

```typescript
// test/mocks/keycloak.mock.ts
export const mockKeycloak = {
  init: jest.fn().mockResolvedValue(true),
  login: jest.fn(),
  logout: jest.fn(),
  loadUserProfile: jest.fn().mockResolvedValue({
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  }),
  updateToken: jest.fn().mockResolvedValue(true),
  hasRealmRole: jest.fn().mockReturnValue(true),
  hasResourceRole: jest.fn().mockReturnValue(true),
  authenticated: true,
  token: 'mock-jwt-token',
  tokenParsed: {
    sub: 'user-123',
    preferred_username: 'testuser',
    email: 'test@example.com',
    realm_access: { roles: ['operator'] },
    resource_access: {
      'logix-frontend': { roles: ['shipment:read', 'shipment:create'] }
    },
  },
};

jest.mock('keycloak-js', () => {
  return jest.fn().mockImplementation(() => mockKeycloak);
});
```

---

## 🚀 Deployment con Keycloak

### **Docker Compose**

```yaml
version: '3.8'

services:
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak
      KC_HOSTNAME: localhost
      KC_HOSTNAME_PORT: 8080
      KC_HOSTNAME_STRICT: false
      KC_HOSTNAME_STRICT_HTTPS: false
      KC_HTTP_ENABLED: true
      KC_METRICS_ENABLED: true
      KC_HEALTH_ENABLED: true
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    command: start-dev

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak
    volumes:
      - keycloak_data:/var/lib/postgresql/data

volumes:
  keycloak_data:
```

---

## 📊 Criterios de Aceptación Adicionales

| # | Criterio | Status |
|---|----------|--------|
| 1 | Keycloak configurado con realm "logistica" | ⏳ |
| 2 | Cliente "logix-frontend" configurado con PKCE | ⏳ |
| 3 | AuthService integrado con Keycloak | ⏳ |
| 4 | Auto-refresh de tokens funcionando | ⏳ |
| 5 | HttpClient inyecta JWT automáticamente | ⏳ |
| 6 | Backend valida JWT con public key | ⏳ |
| 7 | Roles y permisos funcionando | ⏳ |
| 8 | Protected routes en frontend | ⏳ |
| 9 | Guards en backend controllers | ⏳ |
| 10 | Logout limpia tokens correctamente | ⏳ |

---

## 📚 Referencias

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [React Keycloak](https://github.com/react-keycloak/react-keycloak)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [OAuth 2.0 PKCE](https://oauth.net/2/pkce/)
