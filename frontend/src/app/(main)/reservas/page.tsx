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
  Check,
  Ban,
  Loader2,
  ChevronDown,
  ChevronUp,
  Box,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ReservaProducto {
  idProducto: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  dimensiones?: {
    largoCm: number;
    anchoCm: number;
    altoCm: number;
  };
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
  const [updatingReserva, setUpdatingReserva] = useState<number | null>(null);
  const [expandedProductos, setExpandedProductos] = useState<Set<number>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    reserva: Reserva | null;
    action: 'confirmar' | 'cancelar' | 'pendiente' | null;
    nuevoEstado: 'confirmado' | 'cancelado' | 'pendiente' | null;
  }>({ open: false, reserva: null, action: null, nuevoEstado: null });

  const toggleProductos = (idReserva: number) => {
    setExpandedProductos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idReserva)) {
        newSet.delete(idReserva);
      } else {
        newSet.add(idReserva);
      }
      return newSet;
    });
  };

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

      const rawData = await response.json();

      // Mapear los datos de la API al formato esperado por el frontend
      const mappedData = rawData.map((reserva: any) => ({
        idReserva: reserva.idReserva,
        idCompra: reserva.idCompra,
        usuarioId: reserva.usuarioId,
        estado: reserva.estado.toLowerCase(), // Convertir a minúsculas
        expiresAt: reserva.expiraEn, // Mapear expiraEn a expiresAt
        fechaCreacion: reserva.fechaCreacion,
        fechaActualizacion: reserva.fechaActualizacion,
        productos: reserva.items?.map((item: any) => {
          const producto: ReservaProducto = {
            idProducto: item.productoId,
            nombre: item.nombre,
            cantidad: item.cantidad,
            precioUnitario: parseFloat(item.precioUnitario),
          };

          // Incluir dimensiones si están disponibles
          if (item.producto?.dimensiones) {
            const dims = item.producto.dimensiones;
            producto.dimensiones = {
              largoCm: parseFloat(dims.largoCm) || 0,
              anchoCm: parseFloat(dims.anchoCm) || 0,
              altoCm: parseFloat(dims.altoCm) || 0,
            };
          }

          return producto;
        }) || [],
      }));

      setReservas(mappedData);
      setLastUpdate(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar reservas';
      setError(message);
      console.error('Error fetching reservas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateReservaStatus = async (
    idReserva: number,
    nuevoEstado: 'confirmado' | 'cancelado' | 'pendiente',
    usuarioId: number,
    motivo?: string
  ) => {
    try {
      const url = `https://comprasg5.mmalgor.com.ar/v1/reservas/${idReserva}`;

      if (nuevoEstado === 'cancelado') {
        // Para cancelar, usamos DELETE con motivo
        const body = {
          motivo: motivo || 'Cancelación solicitada por el usuario',
        };

        console.log('Cancelando reserva:', {
          url,
          method: 'DELETE',
          body,
          bodyStringified: JSON.stringify(body),
        });

        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          let errorMessage = `Error ${response.status}: ${response.statusText}`;
          let errorData: any = {};
          
          try {
            const responseText = await response.text();
            if (responseText) {
              try {
                errorData = JSON.parse(responseText);
                errorMessage = errorData.message || errorData.details || errorData.error || errorMessage;
              } catch {
                // Si no es JSON, usar el texto directamente
                errorMessage = responseText || errorMessage;
              }
            }
          } catch (e) {
            console.warn('No se pudo leer la respuesta del error:', e);
          }
          
          console.error('Error al cancelar reserva:', {
            status: response.status,
            statusText: response.statusText,
            url,
            body,
            errorData,
            errorMessage,
          });
          
          throw new Error(errorMessage || `Error ${response.status}: ${response.statusText}`);
        }
      } else {
        // Para cambiar a confirmado o pendiente, usamos PATCH con estado
        // El enum de PostgreSQL espera valores en MAYÚSCULAS
        const body = {
          usuarioId: usuarioId,
          estado: nuevoEstado.toUpperCase(),
        };

        console.log('Actualizando reserva:', {
          url,
          method: 'PATCH',
          body,
          bodyStringified: JSON.stringify(body),
        });

        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          let errorMessage = `Error ${response.status}: ${response.statusText}`;
          let errorData: any = {};
          
          try {
            const responseText = await response.text();
            if (responseText) {
              try {
                errorData = JSON.parse(responseText);
                errorMessage = errorData.message || errorData.details || errorData.error || errorMessage;
              } catch {
                // Si no es JSON, usar el texto directamente
                errorMessage = responseText || errorMessage;
              }
            }
          } catch (e) {
            console.warn('No se pudo leer la respuesta del error:', e);
          }
          
          console.error('Error al actualizar reserva:', {
            status: response.status,
            statusText: response.statusText,
            url,
            body,
            errorData,
            errorMessage,
          });
          
          throw new Error(errorMessage || `Error ${response.status}: ${response.statusText}`);
        }
      }

      // Actualizar la reserva en el estado local
      setReservas(prevReservas =>
        prevReservas.map(reserva =>
          reserva.idReserva === idReserva
            ? { ...reserva, estado: nuevoEstado, fechaActualizacion: new Date().toISOString() }
            : reserva
        )
      );

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar reserva';
      console.error('Error updating reserva:', err);
      throw new Error(message);
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

  const calculateVolumeCm3 = (productos: ReservaProducto[] | undefined): number | null => {
    if (!productos || productos.length === 0) {
      return null;
    }

    let totalCm3 = 0;
    let hasValidDimensions = false;

    productos.forEach((producto) => {
      if (
        producto.dimensiones &&
        producto.dimensiones.largoCm > 0 &&
        producto.dimensiones.anchoCm > 0 &&
        producto.dimensiones.altoCm > 0
      ) {
        const volumenCm3 =
          producto.dimensiones.largoCm *
          producto.dimensiones.anchoCm *
          producto.dimensiones.altoCm *
          producto.cantidad;
        totalCm3 += volumenCm3;
        hasValidDimensions = true;
      }
    });

    if (!hasValidDimensions) {
      return null;
    }

    return totalCm3;
  };

  const calculateVolumeM3 = (productos: ReservaProducto[] | undefined): number | null => {
    const cm3 = calculateVolumeCm3(productos);
    if (cm3 === null) {
      return null;
    }
    // Convertir de cm³ a m³ (dividir por 1,000,000)
    return cm3 / 1_000_000;
  };

  const formatVolume = (productos: ReservaProducto[] | undefined): string => {
    const cm3 = calculateVolumeCm3(productos);
    
    if (cm3 === null) {
      return 'N/A - Sin dimensiones';
    }

    // Convertir a m³ desde cm³ para evitar problemas de precisión
    const m3 = cm3 / 1_000_000;

    // Formatear m³ con más decimales si es necesario
    let m3Formatted: string;
    if (m3 < 0.01) {
      // Para valores muy pequeños, mostrar más decimales
      m3Formatted = m3.toFixed(6).replace(/\.?0+$/, '');
    } else if (m3 < 1) {
      m3Formatted = m3.toFixed(4).replace(/\.?0+$/, '');
    } else {
      m3Formatted = m3.toFixed(2).replace(/\.?0+$/, '');
    }

    return `${m3Formatted} m³ (${cm3.toLocaleString('es-AR')} cm³)`;
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

  const handleChangeEstado = (reserva: Reserva, nuevoEstado: 'confirmado' | 'cancelado' | 'pendiente') => {
    const actionMap = {
      confirmado: 'confirmar',
      cancelado: 'cancelar',
      pendiente: 'pendiente',
    } as const;

    setConfirmDialog({
      open: true,
      reserva,
      action: actionMap[nuevoEstado],
      nuevoEstado,
    });
  };

  const executeReservaAction = async () => {
    if (!confirmDialog.reserva || !confirmDialog.nuevoEstado) return;

    const { reserva, nuevoEstado } = confirmDialog;
    setUpdatingReserva(reserva.idReserva);

    try {
      await updateReservaStatus(
        reserva.idReserva,
        nuevoEstado,
        reserva.usuarioId,
        nuevoEstado === 'cancelado' ? 'Cancelación solicitada por el usuario' : undefined
      );

      // Cerrar diálogo
      setConfirmDialog({ open: false, reserva: null, action: null, nuevoEstado: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar reserva';
      setError(message);
    } finally {
      setUpdatingReserva(null);
    }
  };

  // Función para determinar qué botones mostrar según el estado actual
  const getAvailableActions = (estado: string): Array<{ estado: 'confirmado' | 'cancelado' | 'pendiente'; label: string; color: string; icon: React.ReactNode }> => {
    const actions = [];

    if (estado !== 'confirmado') {
      actions.push({
        estado: 'confirmado' as const,
        label: 'Confirmar',
        color: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
        icon: <Check className="w-3 h-3" />,
      });
    }

    if (estado !== 'pendiente') {
      actions.push({
        estado: 'pendiente' as const,
        label: 'Pendiente',
        color: 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600',
        icon: <Clock className="w-3 h-3" />,
      });
    }

    if (estado !== 'cancelado') {
      actions.push({
        estado: 'cancelado' as const,
        label: 'Cancelar',
        color: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
        icon: <Ban className="w-3 h-3" />,
      });
    }

    return actions;
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
              <div className="text-2xl font-bold text-gray-900">{estadisticas.total}</div>
              <div className="text-sm text-gray-700 font-medium">Total</div>
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
            <p className="text-gray-700">Cargando reservas...</p>
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
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No hay reservas disponibles
                </h3>
                <p className="text-gray-600">
                  No se encontraron reservas en el sistema.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {sortedReservas.map((reserva) => {
                const gradient = getCardGradient(reserva.idReserva);
                const total = calculateTotal(reserva.productos);
                const expired = isExpired(reserva.expiresAt) && reserva.estado !== 'cancelado';
                const volumeM3 = calculateVolumeM3(reserva.productos);


                return (
                  <Card
                    key={reserva.idReserva}
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 flex flex-col h-full"
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
                    <CardContent className="p-6 space-y-4 flex-grow">
                      {/* Información Principal */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-700 font-medium">Usuario:</span>
                          <span className="font-semibold text-gray-900">
                            #{reserva.usuarioId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-700 font-medium">Productos:</span>
                          <span className="font-semibold text-gray-900">
                            {reserva.productos?.length || 0}
                          </span>
                        </div>
                      </div>

                      {/* Fechas */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-700 font-medium">Creada:</span>
                          <span className="text-gray-900">{formatDate(reserva.fechaCreacion)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-700 font-medium">Expira:</span>
                          <span
                            className={`font-semibold ${
                              expired ? 'text-red-700' : 'text-gray-900'
                            }`}
                          >
                            {formatDate(reserva.expiresAt)}
                            {expired && ' (Expirada)'}
                          </span>
                        </div>
                        {reserva.fechaActualizacion !== reserva.fechaCreacion && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-gray-700">
                              Actualizada: {formatDate(reserva.fechaActualizacion)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Volumen (m³) */}
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                          <Box className="w-5 h-5 text-cyan-700 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-xs font-medium text-cyan-700 mb-0.5">
                              Volumen Total
                            </div>
                            <div className={`text-sm font-semibold ${
                              calculateVolumeCm3(reserva.productos) === null
                                ? 'text-gray-600'
                                : 'text-cyan-900'
                            }`}>
                              {formatVolume(reserva.productos)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Productos - Botón desplegable */}
                      {reserva.productos && reserva.productos.length > 0 && (
                        <div className="pt-2 border-t">
                          <button
                            onClick={() => toggleProductos(reserva.idReserva)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                          >
                            <div className="flex items-center gap-3">
                              <Package className="w-5 h-5 text-gray-600" />
                              <div className="text-left">
                                <div className="font-semibold text-gray-900">
                                  Productos Reservados
                                </div>
                                <div className="text-sm text-gray-600">
                                  {reserva.productos.length} {reserva.productos.length === 1 ? 'producto' : 'productos'} • Total: {formatPrice(total)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 font-medium">
                                {expandedProductos.has(reserva.idReserva) ? 'Ocultar' : 'Ver detalles'}
                              </span>
                              {expandedProductos.has(reserva.idReserva) ? (
                                <ChevronUp className="w-5 h-5 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                          </button>

                          {/* Contenido desplegable */}
                          {expandedProductos.has(reserva.idReserva) && (
                            <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                              {reserva.productos.map((producto, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-white rounded-lg p-3 text-sm border border-gray-200"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                      {producto.nombre}
                                    </div>
                                    <div className="text-gray-600">
                                      Cantidad: {producto.cantidad} ×{' '}
                                      {formatPrice(producto.precioUnitario)}
                                    </div>
                                  </div>
                                  <div className="font-semibold text-gray-900">
                                    {formatPrice(producto.precioUnitario * producto.cantidad)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </CardContent>

                    {/* Card Footer */}
                    <CardFooter className="p-4 pt-0 flex flex-col gap-3 text-xs text-gray-600 border-t bg-gray-50 min-h-[80px]">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">ID Reserva: {reserva.idReserva}</span>
                        {expired && (
                          <Badge variant="outline" className="text-red-600 border-red-300">
                            Expirada
                          </Badge>
                        )}
                      </div>

                      {/* Botones de acción - Mostrar según estado actual */}
                      <div className="flex items-center justify-between w-full">
                        {/* Badge de estado actual */}
                        <div>
                          {reserva.estado === 'confirmado' && (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Confirmada
                            </Badge>
                          )}

                          {reserva.estado === 'cancelado' && (
                            <Badge variant="outline" className="text-gray-600 border-gray-300">
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancelada
                            </Badge>
                          )}

                          {reserva.estado === 'pendiente' && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendiente
                            </Badge>
                          )}
                        </div>

                        {/* Botones de acción */}
                        {!expired && (
                          <div className="flex gap-2">
                            {getAvailableActions(reserva.estado).map((action) => (
                              <Button
                                key={action.estado}
                                size="sm"
                                variant="default"
                                onClick={() => handleChangeEstado(reserva, action.estado)}
                                disabled={updatingReserva === reserva.idReserva}
                                className={`h-8 px-3 text-xs font-medium ${action.color} min-w-[100px] flex items-center justify-center gap-1.5`}
                              >
                                {updatingReserva === reserva.idReserva ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>...</span>
                                  </>
                                ) : (
                                  <>
                                    {action.icon}
                                    <span>{action.label}</span>
                                  </>
                                )}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Diálogo de confirmación */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) =>
        setConfirmDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'confirmar' && 'Confirmar Reserva'}
              {confirmDialog.action === 'cancelar' && 'Cancelar Reserva'}
              {confirmDialog.action === 'pendiente' && 'Marcar como Pendiente'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'confirmar' &&
                `¿Está seguro de que desea confirmar la reserva #${confirmDialog.reserva?.idReserva}? Esta acción confirmará la reserva.`
              }
              {confirmDialog.action === 'cancelar' &&
                `¿Está seguro de que desea cancelar la reserva #${confirmDialog.reserva?.idReserva}? Los productos reservados serán liberados.`
              }
              {confirmDialog.action === 'pendiente' &&
                `¿Está seguro de que desea marcar la reserva #${confirmDialog.reserva?.idReserva} como pendiente?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeReservaAction}
              disabled={updatingReserva !== null}
              className={
                confirmDialog.action === 'confirmar'
                  ? 'bg-green-600 hover:bg-green-700'
                  : confirmDialog.action === 'cancelar'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }
            >
              {updatingReserva !== null ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                confirmDialog.action === 'confirmar'
                  ? 'Confirmar'
                  : confirmDialog.action === 'cancelar'
                  ? 'Cancelar'
                  : 'Marcar Pendiente'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

