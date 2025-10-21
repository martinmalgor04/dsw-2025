import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { getDistance } from 'geolib';
import { QuoteCacheService } from './quote-cache.service';

export interface DistanceCalculationResult {
  distance: number; // in kilometers
  source: 'api' | 'manual' | 'cache';
  responseTime: number; // in milliseconds
}

@Injectable()
export class DistanceCalculationService {
  private readonly logger = new Logger(DistanceCalculationService.name);
  private readonly apiUrl: string | undefined;
  private readonly apiKey: string | undefined;
  private readonly timeout: number;

  // Coordinates of most common Argentine postal codes
  private readonly postalCodeCoordinates: Record<string, { lat: number; lon: number }> = {
    // Buenos Aires
    'C1000AAA': { lat: -34.6037, lon: -58.3816 }, // CABA
    'C1000ABC': { lat: -34.6037, lon: -58.3816 }, // CABA
    'B1000AAA': { lat: -34.6037, lon: -58.3816 }, // Buenos Aires

    // Chaco
    'H3500ABC': { lat: -27.4516, lon: -58.9867 }, // Resistencia
    'H3500AAA': { lat: -27.4516, lon: -58.9867 }, // Resistencia

    // Córdoba
    'X5000ABC': { lat: -31.4201, lon: -64.1888 }, // Córdoba
    'X5000AAA': { lat: -31.4201, lon: -64.1888 }, // Córdoba

    // Santa Fe
    'S3000ABC': { lat: -31.6333, lon: -60.7 }, // Santa Fe
    'S2000ABC': { lat: -32.9442, lon: -60.6505 }, // Rosario

    // Mendoza
    'M5500ABC': { lat: -32.8908, lon: -68.8272 }, // Mendoza

    // Tucumán
    'T4000ABC': { lat: -26.8083, lon: -65.2176 }, // San Miguel de Tucumán

    // Salta
    'A4400ABC': { lat: -24.7821, lon: -65.4232 }, // Salta

    // Jujuy
    'Y4600ABC': { lat: -24.1858, lon: -65.2995 }, // San Salvador de Jujuy

    // La Plata
    'B1900ABC': { lat: -34.9214, lon: -57.9544 }, // La Plata

    // Mar del Plata
    'B7600ABC': { lat: -38.0023, lon: -57.5575 }, // Mar del Plata
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly cacheService: QuoteCacheService,
  ) {
    this.apiUrl = this.configService.get<string>('DISTANCE_API_URL');
    this.apiKey = this.configService.get<string>('DISTANCE_API_KEY');
    this.timeout = this.configService.get<number>('STOCK_API_TIMEOUT', 2000);
  }

  async calculateDistance(fromPostalCode: string, toPostalCode: string): Promise<DistanceCalculationResult> {
    const startTime = Date.now();

    // 1) Cache
    const cached = await this.cacheService.getDistance(fromPostalCode, toPostalCode);
    if (cached !== null) {
      return { distance: cached, source: 'cache', responseTime: Date.now() - startTime };
    }

    // 2) External API
    if (this.apiUrl && this.apiKey) {
      try {
        const d = await this.fetchFromAPI(fromPostalCode, toPostalCode);
        await this.cacheService.setDistance(fromPostalCode, toPostalCode, d);
        return { distance: d, source: 'api', responseTime: Date.now() - startTime };
      } catch (err) {
        this.logger.warn(`External distance API failed: ${err?.message}`);
      }
    }

    // 3) Manual fallback
    const d = await this.calculateManually(fromPostalCode, toPostalCode);
    await this.cacheService.setDistance(fromPostalCode, toPostalCode, d);
    return { distance: d, source: 'manual', responseTime: Date.now() - startTime };
  }

  private async fetchFromAPI(fromPostalCode: string, toPostalCode: string): Promise<number> {
    const url = this.buildApiUrl(fromPostalCode, toPostalCode);
    const resp = await firstValueFrom(
      this.httpService.get(url, {
        timeout: this.timeout,
        headers: { Accept: 'application/json', 'User-Agent': 'Shipping-Service/1.0' },
      }),
    );
    return this.parseApiResponse(resp.data, fromPostalCode, toPostalCode);
  }

  private buildApiUrl(fromPostalCode: string, toPostalCode: string): string {
    if (!this.apiUrl || !this.apiKey) throw new Error('API URL and API Key must be configured');
    if (this.apiUrl.includes('distancematrix.ai'))
      return `${this.apiUrl}?origins=${fromPostalCode}&destinations=${toPostalCode}&key=${this.apiKey}`;
    if (this.apiUrl.includes('googleapis.com'))
      return `${this.apiUrl}?origins=${fromPostalCode}&destinations=${toPostalCode}&key=${this.apiKey}`;
    if (this.apiUrl.includes('openrouteservice.org'))
      return `${this.apiUrl}?api_key=${this.apiKey}&locations=${fromPostalCode}|${toPostalCode}&profile=driving-car`;
    return `${this.apiUrl}?from=${fromPostalCode}&to=${toPostalCode}&key=${this.apiKey}`;
  }

  private parseApiResponse(data: any, fromPostalCode: string, toPostalCode: string): number {
    if (data?.rows?.[0]?.elements?.[0]?.status === 'OK' && data.rows[0].elements[0].distance)
      return data.rows[0].elements[0].distance.value / 1000;
    if (data?.distances?.[0]?.[1]) return data.distances[0][1] / 1000;
    if (data?.distance) return typeof data.distance === 'number' ? data.distance : parseFloat(data.distance);
    throw new Error(`Could not parse API response for ${fromPostalCode} -> ${toPostalCode}`);
  }

  private async calculateManually(fromPostalCode: string, toPostalCode: string): Promise<number> {
    const from = this.getCoordinatesForPostalCode(fromPostalCode);
    const to = this.getCoordinatesForPostalCode(toPostalCode);
    if (!from || !to) throw new Error(`No coordinates found for postal codes: ${fromPostalCode} or ${toPostalCode}`);
    const meters = getDistance({ latitude: from.lat, longitude: from.lon }, { latitude: to.lat, longitude: to.lon });
    return meters / 1000;
  }

  private getCoordinatesForPostalCode(postalCode: string): { lat: number; lon: number } | null {
    if (this.postalCodeCoordinates[postalCode]) return this.postalCodeCoordinates[postalCode];
    const prefix = postalCode.substring(0, 5);
    for (const [code, coords] of Object.entries(this.postalCodeCoordinates)) {
      if (code.startsWith(prefix)) return coords as { lat: number; lon: number };
    }
    this.logger.warn(`No coordinates found for postal code: ${postalCode}`);
    return null;
  }
}


