"use client";

import React, { useEffect, useState } from 'react';
import {
  Package,
  DollarSign,
  Box,
  MapPin,
  RefreshCw,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  stockDisponible: number;
  pesoKg: string;
  dimensiones: {
    largoCm: string;
    anchoCm: string;
    altoCm: string;
  };
  ubicacion: {
    calle: string;
    ciudad: string;
    provincia: string;
    codigoPostal: string;
    pais: string;
  };
  imagenes: Array<{
    id: number;
    url: string;
    esPrincipal: boolean;
    productoId: number;
  }>;
  categorias: Array<{
    id: number;
    nombre: string;
    descripcion: string;
  }>;
}

type SortOption = 'id' | 'nombre' | 'precio' | 'stock';
type SortDirection = 'asc' | 'desc';

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const fetchProductos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://comprasg5.mmalgor.com.ar/v1/productos', {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setProductos(data);
      setLastUpdate(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar productos';
      setError(message);
      console.error('Error fetching productos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const formatPrice = (price: string): string => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(numPrice);
  };

  const getStockBadgeVariant = (stock: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (stock === 0) return 'destructive';
    if (stock < 10) return 'outline';
    return 'secondary';
  };

  const getCardGradient = (id: number): string => {
    const gradients = [
      'from-cyan-500 to-teal-500',
      'from-purple-500 to-pink-500',
      'from-blue-500 to-indigo-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-yellow-500 to-amber-500',
      'from-violet-500 to-purple-500',
      'from-rose-500 to-pink-500',
    ];
    return gradients[id % gradients.length];
  };

  const getStockColor = (stock: number): string => {
    if (stock === 0) return 'text-red-700 font-bold';
    if (stock < 10) return 'text-orange-700 font-bold';
    return 'text-green-700 font-bold';
  };

  const getCategoriaColor = (categoriaNombre: string): string => {
    const colors = {
      'Electrónica': 'text-blue-700 bg-blue-50 border-blue-200',
      'Hogar': 'text-green-700 bg-green-50 border-green-200',
      'Deportes': 'text-orange-700 bg-orange-50 border-orange-200',
      'Ropa': 'text-purple-700 bg-purple-50 border-purple-200',
      'Libros': 'text-indigo-700 bg-indigo-50 border-indigo-200',
      'Juguetes': 'text-pink-700 bg-pink-50 border-pink-200',
      'Herramientas': 'text-gray-700 bg-gray-50 border-gray-200',
      'Belleza': 'text-rose-700 bg-rose-50 border-rose-200',
    };
    return colors[categoriaNombre as keyof typeof colors] || 'text-gray-700 bg-gray-50 border-gray-200';
  };

  const sortedProductos = [...productos].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'nombre':
        aValue = a.nombre.toLowerCase();
        bValue = b.nombre.toLowerCase();
        break;
      case 'precio':
        aValue = parseFloat(a.precio) || 0;
        bValue = parseFloat(b.precio) || 0;
        break;
      case 'stock':
        aValue = a.stockDisponible;
        bValue = b.stockDisponible;
        break;
      case 'id':
      default:
        aValue = a.id;
        bValue = b.id;
        break;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const handleSortChange = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="w-8 h-8" />
              Catálogo de Productos
            </h1>
            <p className="text-cyan-50 mt-2">
              {productos.length} {productos.length === 1 ? 'producto' : 'productos'} disponibles
              {lastUpdate && (
                <span className="ml-2 text-sm">
                  (Actualizado: {lastUpdate.toLocaleTimeString('es-AR')})
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
              <span className="text-sm font-medium">Ordenar por:</span>
              <div className="flex gap-1">
                {(['id', 'nombre', 'precio', 'stock'] as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSortChange(option)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                      sortBy === option
                        ? 'bg-white text-cyan-600'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {option === 'id' && 'ID'}
                    {option === 'nombre' && 'Nombre'}
                    {option === 'precio' && 'Precio'}
                    {option === 'stock' && 'Stock'}
                    {getSortIcon(option)}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={fetchProductos}
              disabled={isLoading}
              variant="secondary"
              className="bg-white text-cyan-600 hover:bg-cyan-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && productos.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
            <p className="text-gray-700">Cargando productos...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Error al cargar productos
            </CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={fetchProductos} variant="destructive">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Products Grid */}
      {!isLoading && !error && (
        <>
          {sortedProductos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No hay productos disponibles
                </h3>
                <p className="text-gray-500">
                  No se encontraron productos en el catálogo.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProductos.map((producto) => {
                const mainImage = producto.imagenes.find((img) => img.esPrincipal) || producto.imagenes[0];
                const gradient = getCardGradient(producto.id);

                return (
                  <Card
                    key={producto.id}
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-cyan-300"
                  >
                    {/* Card Header with Gradient and Image */}
                    <CardHeader className="p-0">
                      <div
                        className={`h-40 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}
                      >
                        {mainImage ? (
                          <img
                            src={mainImage.url}
                            alt={producto.nombre}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package className="w-16 h-16 text-white/50" />
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant={getStockBadgeVariant(producto.stockDisponible)}
                            className="bg-white/95 backdrop-blur-sm text-gray-800 font-medium border-gray-300"
                          >
                            <Box className="w-3 h-3 mr-1" />
                            {producto.stockDisponible} unidades
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Card Content */}
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-800 mb-1 line-clamp-2">
                          {producto.nombre}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 line-clamp-2">
                          {producto.descripcion}
                        </CardDescription>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1 text-lg font-bold text-cyan-600">
                          <DollarSign className="w-5 h-5" />
                          {formatPrice(producto.precio)}
                        </div>
                        <div className={`text-sm ${getStockColor(producto.stockDisponible)}`}>
                          Stock: {producto.stockDisponible}
                        </div>
                      </div>

                      {/* Categories */}
                      {producto.categorias.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2 border-t">
                          {producto.categorias.slice(0, 3).map((categoria) => (
                            <Badge
                              key={categoria.id}
                              variant="outline"
                              className={`text-xs font-medium ${getCategoriaColor(categoria.nombre)}`}
                            >
                              {categoria.nombre}
                            </Badge>
                          ))}
                          {producto.categorias.length > 3 && (
                            <Badge variant="outline" className="text-xs font-medium text-gray-700 bg-gray-50 border-gray-200">
                              +{producto.categorias.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Dimensions and Weight */}
                      <div className="text-xs text-gray-700 space-y-1 pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Box className="w-3 h-3" />
                          <span>
                            {producto.dimensiones.largoCm} × {producto.dimensiones.anchoCm} ×{' '}
                            {producto.dimensiones.altoCm} cm
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          <span>Peso: {producto.pesoKg} kg</span>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-1 text-xs text-gray-700 pt-2 border-t">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">
                          {producto.ubicacion.ciudad}, {producto.ubicacion.provincia}
                        </span>
                      </div>
                    </CardContent>

                    {/* Card Footer */}
                    <CardFooter className="p-4 pt-0 flex items-center justify-between text-xs text-gray-600 border-t">
                      <span>ID: {producto.id}</span>
                      <span>CP: {producto.ubicacion.codigoPostal}</span>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

