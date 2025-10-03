import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnvioService {
  constructor(private prisma: PrismaService) {}

  async calcularPrecioEnvio(
    codigoPostalOrigen: string,
    codigoPostalDestino: string,
    volumen: number,
    precio?: number,
  ) {
    // Validar códigos postales
    this.validarCodigoPostal(codigoPostalOrigen);
    this.validarCodigoPostal(codigoPostalDestino);

    // Validar volumen
    if (volumen < 0) {
      throw new BadRequestException('El volumen debe ser mayor o igual a 0');
    }

    // Lógica de cálculo de precio (simplificada)
    const precioCalculado = this.calcularPrecio(
      codigoPostalOrigen,
      codigoPostalDestino,
      volumen,
      precio,
    );

    // Guardar el cálculo en la base de datos
    await this.prisma.envioCalculo.create({
      data: {
        codigoPostalOrigen,
        codigoPostalDestino,
        precio: precio || 0,
        volumen,
        precioCalculado,
      },
    });

    // Devolver respuesta estructurada
    return {
      success: true,
      data: {
        precioCalculado,
        codigoPostalOrigen,
        codigoPostalDestino,
        volumen,
        precio: precio || null,
        distancia: this.calcularDistancia(codigoPostalOrigen, codigoPostalDestino),
        fechaCalculo: new Date().toISOString(),
      },
      message: 'Precio de envío calculado exitosamente'
    };
  }

  private validarCodigoPostal(codigo: string) {
    const pattern = /^(?:[A-Za-z]\d{4}(?:[ -]?[A-Za-z]{3})|\d{4})$/;
    if (!pattern.test(codigo)) {
      throw new BadRequestException(
        'Formato de código postal inválido. Use formato: C1001ABC o 1001',
      );
    }
  }

  private calcularPrecio(
    origen: string,
    destino: string,
    volumen: number,
    precio?: number,
  ): number {
    // Lógica simplificada de cálculo
    // En un caso real, esto sería más complejo
    
    // Factor base por volumen
    const factorVolumen = volumen * 0.5;
    
    // Factor por distancia (simulado)
    const factorDistancia = this.calcularDistancia(origen, destino) * 0.1;
    
    // Factor por precio del producto (si se proporciona)
    const factorPrecio = precio ? precio * 0.05 : 0;
    
    const precioBase = 10; // Precio base mínimo
    const precioCalculado = precioBase + factorVolumen + factorDistancia + factorPrecio;
    
    // Validar si el destino es muy lejano
    if (this.esDestinoMuyLejano(origen, destino)) {
      throw new HttpException('Queda muy lejos', HttpStatus.FAILED_DEPENDENCY);
    }
    
    return Math.round(precioCalculado * 100) / 100; // Redondear a 2 decimales
  }

  private calcularDistancia(origen: string, destino: string): number {
    // Simulación de cálculo de distancia basado en códigos postales
    // Para códigos numéricos, usamos la diferencia directa
    const numOrigen = this.extraerNumeroCodigoPostal(origen);
    const numDestino = this.extraerNumeroCodigoPostal(destino);
    return Math.abs(numOrigen - numDestino);
  }

  private extraerNumeroCodigoPostal(codigo: string): number {
    // Extraer solo los números del código postal
    const numeros = codigo.replace(/\D/g, '');
    return parseInt(numeros) || 0;
  }

  private esDestinoMuyLejano(origen: string, destino: string): boolean {
    // Simulación: si la diferencia numérica es mayor a 5000, es muy lejano
    const distancia = this.calcularDistancia(origen, destino);
    return distancia > 5000;
  }
}
