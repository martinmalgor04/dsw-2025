import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class StockConfigValidator {
  @IsString()
  STOCK_API_URL: string;

  @IsNumber()
  @Min(1000)
  @Max(10000)
  STOCK_API_TIMEOUT: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  STOCK_API_RETRY_ATTEMPTS: number;

  @IsNumber()
  @Min(500)
  @Max(5000)
  STOCK_API_RETRY_DELAY: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  STOCK_CIRCUIT_BREAKER_THRESHOLD: number;

  @IsNumber()
  @Min(10000)
  @Max(120000)
  STOCK_CIRCUIT_BREAKER_TIMEOUT: number;

  @IsNumber()
  @Min(60)
  @Max(3600)
  STOCK_CACHE_TTL: number;

  @IsNumber()
  @Min(100)
  @Max(10000)
  STOCK_CACHE_MAX_ITEMS: number;

  @IsString()
  @IsOptional()
  REDIS_HOST?: string;

  @IsNumber()
  @IsOptional()
  @Min(1024)
  @Max(65535)
  REDIS_PORT?: number;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(15)
  REDIS_DB?: number;

  @IsString()
  KEYCLOAK_URL: string;

  @IsString()
  KEYCLOAK_REALM: string;

  @IsString()
  KEYCLOAK_CLIENT_ID: string;

  @IsString()
  KEYCLOAK_CLIENT_SECRET: string;

  @IsString()
  KEYCLOAK_GRANT_TYPE: string;
}
