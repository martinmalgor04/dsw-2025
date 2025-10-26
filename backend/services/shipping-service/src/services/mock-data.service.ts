import { Injectable } from '@nestjs/common';

@Injectable()
export class MockDataService {
  // Mock de productos con peso y dimensiones
  private readonly mockProducts = [
    {
      id: 1,
      name: 'Laptop Gaming',
      weight: 2.5, // kg
      dimensions: {
        length: 35, // cm
        width: 25,
        height: 2.5,
      },
      price: 150000,
      category: 'electronics',
    },
    {
      id: 2,
      name: 'Mouse Inalámbrico',
      weight: 0.1,
      dimensions: {
        length: 12,
        width: 6,
        height: 3,
      },
      price: 2500,
      category: 'electronics',
    },
    {
      id: 3,
      name: 'Teclado Mecánico',
      weight: 1.2,
      dimensions: {
        length: 44,
        width: 13,
        height: 3,
      },
      price: 8500,
      category: 'electronics',
    },
    {
      id: 4,
      name: 'Monitor 24"',
      weight: 4.8,
      dimensions: {
        length: 55,
        width: 35,
        height: 8,
      },
      price: 45000,
      category: 'electronics',
    },
    {
      id: 5,
      name: 'Libro de Programación',
      weight: 0.8,
      dimensions: {
        length: 24,
        width: 17,
        height: 3,
      },
      price: 3500,
      category: 'books',
    },
  ];

  // Mock de distancias entre ciudades (en km)
  private readonly mockDistances = {
    CABA: {
      'Buenos Aires': 0,
      'La Plata': 56,
      'Mar del Plata': 400,
      Córdoba: 710,
      Rosario: 300,
      Mendoza: 1050,
      Tucumán: 1300,
      Resistencia: 1000,
      Corrientes: 980,
    },
    'La Plata': {
      CABA: 56,
      'Buenos Aires': 56,
      'Mar del Plata': 344,
      Córdoba: 766,
      Rosario: 356,
      Mendoza: 1106,
      Tucumán: 1356,
      Resistencia: 1056,
      Corrientes: 1036,
    },
    Córdoba: {
      CABA: 710,
      'La Plata': 766,
      'Mar del Plata': 1110,
      'Buenos Aires': 710,
      Rosario: 410,
      Mendoza: 340,
      Tucumán: 590,
      Resistencia: 290,
      Corrientes: 270,
    },
  };

  // Mock de tarifas por tipo de transporte y distancia
  private readonly mockRates = {
    STANDARD: {
      baseRate: 500, // ARS
      perKm: 15, // ARS por km
      perKg: 50, // ARS por kg
    },
    EXPRESS: {
      baseRate: 800,
      perKm: 25,
      perKg: 80,
    },
    OVERNIGHT: {
      baseRate: 1200,
      perKm: 35,
      perKg: 120,
    },
  };

  /**
   * Obtiene información mock de un producto
   */
  getProductById(productId: number) {
    return this.mockProducts.find((p) => p.id === productId);
  }

  /**
   * Calcula distancia mock entre dos ciudades
   */
  calculateDistance(originCity: string, destinationCity: string): number {
    const origin = this.mockDistances[originCity];
    if (!origin) {
      return 500; // Distancia por defecto si no se encuentra la ciudad
    }

    const distance = origin[destinationCity];
    if (distance === undefined) {
      return 500; // Distancia por defecto
    }

    return distance;
  }

  /**
   * Calcula costo mock de envío
   */
  calculateShippingCost(
    distance: number,
    totalWeight: number,
    transportType: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT',
  ) {
    const rates = this.mockRates[transportType];

    const baseCost = rates.baseRate;
    const distanceCost = distance * rates.perKm;
    const weightCost = totalWeight * rates.perKg;

    const subtotal = baseCost + distanceCost + weightCost;

    // Agregar impuestos (21% IVA + 3% otros)
    const taxRate = 0.24;
    const taxes = subtotal * taxRate;

    const total = subtotal + taxes;

    return {
      base_cost: baseCost,
      distance_cost: distanceCost,
      weight_cost: weightCost,
      subtotal,
      taxes,
      total_cost: Math.round(total),
      currency: 'ARS',
    };
  }

  /**
   * Genera tracking number mock
   */
  generateTrackingNumber(): string {
    const prefix = 'LOG';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Simula tiempo de entrega mock
   */
  getEstimatedDeliveryTime(
    transportType: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT',
    distance: number,
  ): number {
    const baseTime = {
      STANDARD: 3, // días base
      EXPRESS: 1, // día base
      OVERNIGHT: 1, // día base
    };

    const additionalDays = Math.ceil(distance / 500); // 1 día extra por cada 500km
    return baseTime[transportType] + additionalDays;
  }

  /**
   * Obtiene todos los productos mock
   */
  getAllProducts() {
    return this.mockProducts;
  }

  /**
   * Simula llamada a API de Stock
   */
  async getStockInfo(productIds: number[]) {
    // Simula delay de red
    await new Promise((resolve) => setTimeout(resolve, 100));

    return productIds.map((id) => {
      const product = this.getProductById(id);
      if (!product) {
        return {
          id,
          available: false,
          error: 'Product not found',
        };
      }

      return {
        id,
        available: true,
        weight: product.weight,
        dimensions: product.dimensions,
        price: product.price,
      };
    });
  }

  /**
   * Simula llamada a API de distancias
   */
  async getDistanceInfo(
    originPostalCode: string,
    destinationPostalCode: string,
  ) {
    // Simula delay de red
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Extraer ciudad del código postal (simplificado)
    const originCity = this.extractCityFromPostalCode(originPostalCode);
    const destinationCity = this.extractCityFromPostalCode(
      destinationPostalCode,
    );

    const distance = this.calculateDistance(originCity, destinationCity);

    return {
      origin: {
        postal_code: originPostalCode,
        city: originCity,
      },
      destination: {
        postal_code: destinationPostalCode,
        city: destinationCity,
      },
      distance_km: distance,
      estimated_time_hours: Math.round(distance / 60), // Asumiendo 60km/h promedio
    };
  }

  /**
   * Extrae ciudad del código postal (simplificado para mock)
   */
  private extractCityFromPostalCode(postalCode: string): string {
    // Mapeo simplificado de códigos postales a ciudades
    const codeMap = {
      C1000: 'CABA',
      B1900: 'La Plata',
      X5000: 'Córdoba',
      S2000: 'Rosario',
      M5500: 'Mendoza',
      T4000: 'Tucumán',
      H3500: 'Resistencia',
      W3400: 'Corrientes',
      B7600: 'Mar del Plata',
    };

    // Extraer los primeros 5 caracteres
    const prefix = postalCode.substring(0, 5);
    return codeMap[prefix] || 'CABA'; // Default a CABA si no se encuentra
  }
}
