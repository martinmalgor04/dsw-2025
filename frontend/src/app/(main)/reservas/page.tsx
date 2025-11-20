"use client";

import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Calendar,
  User,
  Package,
  RefreshCw,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  FileText,
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

interface ReservaProducto {
  idProducto: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

interface Reserva {
  idReserva: number;
  idCompra: string;
  usuarioId: number;
  estado: 'confirmado' | 'pendiente' | 'cancelado';
  expiresAt?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  productos?: ReservaProducto[];
}

type SortOption = 'idReserva' | 'fechaCreacion' | 'estado' | 'usuarioId' | 'idCompra';
type SortDirection = 'asc' | 'desc';

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('idReserva');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchReservas = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://comprasg5.mmalgor.com.ar/v1/reservas', {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setReservas(data);
      setLastUpdate(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar reservas';
      setError(message);
      console.error('Error fetching reservas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, []);

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) {
      return 'Fecha no disponible';
    }
    
    const date = new Date(dateString);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    try {
      return new Intl.DateTimeFormat('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      console.error('Error formateando fecha:', dateString, error);
      return 'Fecha inválida';
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const getEstadoBadgeVariant = (estado: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (estado) {
      case 'confirmado':
        return 'default';
      case 'pendiente':
        return 'outline';
      case 'cancelado':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'confirmado':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'pendiente':
        return <Clock className="w-4 h-4" />;
      case 'cancelado':
        return <XCircle className="w-4 h-4 text-black" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getEstadoLabel = (estado: string): string => {
    switch (estado) {
      case 'confirmado':
        return 'Confirmado';
      case 'pendiente':
        return 'Pendiente';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado;
    }
  };

  const getCardGradient = (id: number): string => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-indigo-500',
      'from-green-500 to-teal-500',
      'from-orange-500 to-amber-500',
      'from-pink-500 to-rose-500',
      'from-violet-500 to-purple-500',
      'from-emerald-500 to-green-500',
      'from-sky-500 to-blue-500',
    ];
    return gradients[id % gradients.length];
  };

  const calculateTotal = (productos: ReservaProducto[] | undefined): number => {
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return 0;
    }
    return productos.reduce((total, producto) => {
      const precio = producto.precioUnitario || 0;
      const cantidad = producto.cantidad || 0;
      return total + precio * cantidad;
    }, 0);
  };

  const isExpired = (expiresAt: string | undefined | null): boolean => {
    if (!expiresAt) {
      return false;
    }
    const date = new Date(expiresAt);
    if (isNaN(date.getTime())) {
      return false;
    }
    return date < new Date();
  };

  const sortedReservas = [...reservas].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'fechaCreacion':
        const aDate = a.fechaCreacion ? new Date(a.fechaCreacion) : new Date(0);
        const bDate = b.fechaCreacion ? new Date(b.fechaCreacion) : new Date(0);
        aValue = isNaN(aDate.getTime()) ? 0 : aDate.getTime();
        bValue = isNaN(bDate.getTime()) ? 0 : bDate.getTime();
        break;
      case 'estado':
        aValue = a.estado;
        bValue = b.estado;
        break;
      case 'usuarioId':
        aValue = a.usuarioId;
        bValue = b.usuarioId;
        break;
      case 'idCompra':
        aValue = a.idCompra.toLowerCase();
        bValue = b.idCompra.toLowerCase();
        break;
      case 'idReserva':
      default:
        aValue = a.idReserva;
        bValue = b.idReserva;
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
      setSortDirection('desc');
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

  const estadisticas = {
    total: reservas.length,
    confirmadas: reservas.filter((r) => r.estado === 'confirmado').length,
    pendientes: reservas.filter((r) => r.estado === 'pendiente').length,
    canceladas: reservas.filter((r) => r.estado === 'cancelado').length,
    expiradas: reservas.filter((r) => r.expiresAt && isExpired(r.expiresAt) && r.estado !== 'cancelado').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-8 h-8" />
              Reservas
            </h1>
            <p className="text-blue-50 mt-2">
              {reservas.length} {reservas.length === 1 ? 'reserva' : 'reservas'} en total
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
              <div className="flex gap-1 flex-wrap">
                {(
                  [
                    'idReserva',
                    'fechaCreacion',
                    'estado',
                    'usuarioId',
                    'idCompra',
                  ] as SortOption[]
                ).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSortChange(option)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                      sortBy === option
                        ? 'bg-white text-blue-600'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {option === 'idReserva' && 'ID'}
                    {option === 'fechaCreacion' && 'Fecha'}
                    {option === 'estado' && 'Estado'}
                    {option === 'usuarioId' && 'Usuario'}
                    {option === 'idCompra' && 'Compra'}
                    {getSortIcon(option)}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={fetchReservas}
              disabled={isLoading}
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {!isLoading && !error && reservas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-800">{estadisticas.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{estadisticas.confirmadas}</div>
              <div className="text-sm text-green-600">Confirmadas</div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-700">{estadisticas.pendientes}</div>
              <div className="text-sm text-orange-600">Pendientes</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-700">{estadisticas.canceladas}</div>
              <div className="text-sm text-red-600">Canceladas</div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-700">{estadisticas.expiradas}</div>
              <div className="text-sm text-yellow-600">Expiradas</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {isLoading && reservas.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Cargando reservas...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Error al cargar reservas
            </CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={fetchReservas} variant="destructive">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Reservas Grid */}
      {!isLoading && !error && (
        <>
          {sortedReservas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No hay reservas disponibles
                </h3>
                <p className="text-gray-500">
                  No se encontraron reservas en el sistema.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sortedReservas.map((reserva) => {
                const gradient = getCardGradient(reserva.idReserva);
                const total = calculateTotal(reserva.productos);
                const expired = isExpired(reserva.expiresAt) && reserva.estado !== 'cancelado';

                return (
                  <Card
                    key={reserva.idReserva}
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300"
                  >
                    {/* Card Header with Gradient */}
                    <CardHeader className="p-0">
                      <div
                        className={`h-24 bg-gradient-to-br ${gradient} flex items-center justify-between px-6 text-white relative`}
                      >
                        <div className="flex items-center gap-3">
                          <div className=" backdrop-blur-sm rounded-lg p-2">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <CardTitle className="text-white text-lg">
                              Reserva #{reserva.idReserva}
                            </CardTitle>
                            <CardDescription className="text-blue-50 text-xs">
                              {reserva.idCompra}
                            </CardDescription>
                          </div>
                        </div>
                        {reserva.estado === 'cancelado' ? (
                          <span
                            className="justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0  backdrop-blur-sm flex items-center gap-1 border-gray-300 text-black"
                            style={{ color: '#000000 !important' } as React.CSSProperties}
                          >
                            <XCircle className="w-4 h-4" style={{ color: '#000000' }} />
                            <span style={{ color: '#000000', fontWeight: 500 }}>{getEstadoLabel(reserva.estado)}</span>
                          </span>
                        ) : (
                          <Badge
                            variant={getEstadoBadgeVariant(reserva.estado)}
                            className=" backdrop-blur-sm flex items-center gap-1"
                          >
                            {getEstadoIcon(reserva.estado)}
                            {getEstadoLabel(reserva.estado)}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    {/* Card Content */}
                    <CardContent className="p-6 space-y-4">
                      {/* Información Principal */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Usuario:</span>
                          <span className="font-semibold text-gray-800">
                            #{reserva.usuarioId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Productos:</span>
                          <span className="font-semibold text-gray-800">
                            {reserva.productos?.length || 0}
                          </span>
                        </div>
                      </div>

                      {/* Fechas */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Creada:</span>
                          <span className="text-gray-800">{formatDate(reserva.fechaCreacion)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Expira:</span>
                          <span
                            className={`font-semibold ${
                              expired ? 'text-red-600' : 'text-gray-800'
                            }`}
                          >
                            {formatDate(reserva.expiresAt)}
                            {expired && ' (Expirada)'}
                          </span>
                        </div>
                        {reserva.fechaActualizacion !== reserva.fechaCreacion && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>
                              Actualizada: {formatDate(reserva.fechaActualizacion)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Productos */}
                      {reserva.productos && reserva.productos.length > 0 && (
                        <div className="pt-2 border-t">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            Productos Reservados:
                          </h4>
                          <div className="space-y-2">
                            {reserva.productos.map((producto, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-gray-50 rounded-lg p-2 text-sm"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-gray-800">
                                    {producto.nombre}
                                  </div>
                                  <div className="text-gray-600">
                                    Cantidad: {producto.cantidad} ×{' '}
                                    {formatPrice(producto.precioUnitario)}
                                  </div>
                                </div>
                                <div className="font-semibold text-gray-800">
                                  {formatPrice(producto.precioUnitario * producto.cantidad)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Total */}
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">Total:</span>
                          <div className="flex items-center gap-1 text-lg font-bold text-blue-600">
                            <DollarSign className="w-5 h-5" />
                            {formatPrice(total)}
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    {/* Card Footer */}
                    <CardFooter className="p-4 pt-0 flex items-center justify-between text-xs text-gray-500 border-t bg-gray-50">
                      <span>ID Reserva: {reserva.idReserva}</span>
                      {expired && (
                        <Badge variant="outline" className="text-red-600 border-red-300">
                          Expirada
                        </Badge>
                      )}
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

