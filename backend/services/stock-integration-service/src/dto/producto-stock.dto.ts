import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DimensionesDto {
  @ApiProperty({ description: 'Largo en centímetros', example: 30 })
  @IsNumber()
  largoCm: number;

  @ApiProperty({ description: 'Ancho en centímetros', example: 20 })
  @IsNumber()
  anchoCm: number;

  @ApiProperty({ description: 'Alto en centímetros', example: 15 })
  @IsNumber()
  altoCm: number;
}

export class UbicacionAlmacenDto {
  @ApiProperty({ description: 'Calle', example: 'Av. San Martín 123' })
  @IsString()
  street: string;

  @ApiProperty({ description: 'Ciudad', example: 'Resistencia' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Provincia', example: 'Chaco' })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'Código postal en formato CPA',
    example: 'H3500ABC',
  })
  @IsString()
  postal_code: string;

  @ApiProperty({ description: 'País', example: 'Argentina' })
  @IsString()
  country: string;
}

export class ImagenProductoDto {
  @ApiProperty({
    description: 'URL de la imagen',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Si es la imagen principal', example: true })
  @IsNumber()
  esPrincipal: boolean;
}

export class CategoriaDto {
  @ApiProperty({ description: 'ID de la categoría', example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Electrónicos',
  })
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Descripción de la categoría',
    example: 'Productos electrónicos',
    required: false,
  })
  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class ProductoStockDto {
  @ApiProperty({ description: 'ID del producto', example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Laptop Dell Inspiron',
  })
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Descripción del producto',
    example: 'Laptop para gaming',
    required: false,
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ description: 'Precio del producto', example: 150000 })
  @IsNumber()
  precio: number;

  @ApiProperty({ description: 'Stock disponible', example: 10 })
  @IsNumber()
  stockDisponible: number;

  @ApiProperty({ description: 'Peso en kilogramos', example: 2.5 })
  @IsNumber()
  pesoKg: number;

  @ApiProperty({
    description: 'Dimensiones del producto',
    type: DimensionesDto,
  })
  @ValidateNested()
  @Type(() => DimensionesDto)
  dimensiones: DimensionesDto;

  @ApiProperty({
    description: 'Ubicación en el almacén',
    type: UbicacionAlmacenDto,
  })
  @ValidateNested()
  @Type(() => UbicacionAlmacenDto)
  ubicacion: UbicacionAlmacenDto;

  @ApiProperty({
    description: 'Imágenes del producto',
    type: [ImagenProductoDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImagenProductoDto)
  imagenes?: ImagenProductoDto[];

  @ApiProperty({
    description: 'Categorías del producto',
    type: [CategoriaDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoriaDto)
  categorias?: CategoriaDto[];
}
