"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { shipmentService, ShipmentDTO } from '@/app/lib/middleware/services/shipment.service';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/app/components/ui/confirm-dialog';

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [shipment, setShipment] = useState<ShipmentDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    loadShipment();
  }, [id]);

  const loadShipment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await shipmentService.getShipmentById(id);
      setShipment(data);
      setNewStatus(data.status);
    } catch (err) {
      console.error('Error loading shipment:', err);
      // Mock data for development
      setShipment(generateMockShipment(id));
      setNewStatus(generateMockShipment(id).status);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockShipment = (id: string): ShipmentDTO => {
    const statuses = ['PENDING', 'PROCESSING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    const cities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'];
    const statusIndex = parseInt(id.slice(-1), 16) % statuses.length;

    return {
      id,
      orderId: 1000 + parseInt(id.slice(-2), 16),
      originAddress: {
        street: 'Calle 100 #15-20',
        city: 'Bogotá',
        state: 'Cundinamarca',
        postal_code: '110111',
        country: 'Colombia'
      },
      destinationAddress: {
        street: 'Carrera 43A #14-58',
        city: cities[statusIndex % cities.length],
        state: 'Antioquia',
        postal_code: '050001',
        country: 'Colombia'
      },
      products: [
        {
          id: 'prod-1',
          name: 'Laptop Dell XPS 15',
          quantity: 1,
          weight: 2.5,
          dimensions: { length: 40, width: 30, height: 5 }
        },
        {
          id: 'prod-2',
          name: 'Mouse Logitech MX Master 3',
          quantity: 2,
          weight: 0.3,
          dimensions: { length: 15, width: 10, height: 5 }
        }
      ],
      transportMethod: {
        id: 'tm-1',
        name: 'Terrestre Express'
      },
      driver: {
        id: 'drv-1',
        name: 'Carlos Rodríguez',
        phone: '+57 300 123 4567',
        licenseNumber: 'DRV123456'
      },
      vehicle: {
        id: 'veh-1',
        licensePlate: 'ABC123',
        model: 'Toyota HiAce 2022',
        capacity: 1000
      },
      status: statuses[statusIndex],
      totalCost: 85000,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      estimatedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      actualDeliveryDate: statuses[statusIndex] === 'DELIVERED' ? new Date().toISOString() : undefined
    };
  };

  const handleCancelShipment = async () => {
    if (!shipment) return;

    setIsCancelling(true);
    try {
      await shipmentService.cancelShipment(shipment.id);
      toast.success('Envío cancelado exitosamente');
      router.push('/operaciones/seguimiento');
    } catch (err) {
      console.error('Error cancelling shipment:', err);
      toast.error('Error al cancelar el envío');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!shipment || !newStatus || newStatus === shipment.status) return;

    setIsUpdating(true);
    try {
      await shipmentService.updateShipment(shipment.id, { status: newStatus });
      toast.success('Estado actualizado exitosamente');
      await loadShipment();
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Error al actualizar el estado');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING: 'bg-slate-100 text-slate-700',
      PROCESSING: 'bg-blue-100 text-blue-700',
      IN_TRANSIT: 'bg-blue-100 text-blue-700',
      OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-700',
      DELIVERED: 'bg-emerald-100 text-emerald-700',
      CANCELLED: 'bg-red-100 text-red-700'
    };
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      PROCESSING: 'Procesando',
      IN_TRANSIT: 'En Tránsito',
      OUT_FOR_DELIVERY: 'Fuera para Entrega',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status] || badges.PENDING}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg p-6 bg-red-50 border border-red-200">
            <h2 className="text-base font-semibold text-red-900 mb-2">
              Error al cargar el envío
            </h2>
            <p className="text-sm text-red-700 mb-4">
              {error || 'No se pudo cargar la información del envío'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => loadShipment()}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Reintentar
              </button>
              <Link
                href="/operaciones/seguimiento"
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50"
              >
                Volver al listado
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canCancel = !['DELIVERED', 'CANCELLED'].includes(shipment.status);
  const canUpdateStatus = !['DELIVERED', 'CANCELLED'].includes(shipment.status);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/operaciones/seguimiento"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Volver al listado
              </Link>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Envío #{shipment.orderId}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              ID: {shipment.id}
            </p>
          </div>
          <div>
            {getStatusBadge(shipment.status)}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Update Status */}
            {canUpdateStatus && (
              <div className="flex-1 flex gap-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUpdating}
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="PROCESSING">Procesando</option>
                  <option value="IN_TRANSIT">En Tránsito</option>
                  <option value="OUT_FOR_DELIVERY">Fuera para Entrega</option>
                  <option value="DELIVERED">Entregado</option>
                </select>
                <button
                  onClick={handleUpdateStatus}
                  disabled={isUpdating || newStatus === shipment.status}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Actualizando...' : 'Actualizar Estado'}
                </button>
              </div>
            )}

            {/* Cancel Shipment */}
            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={isCancelling}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar Envío
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar este envío?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. El envío #{shipment.orderId} será marcado como cancelado y no podrá ser procesado.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, mantener</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelShipment}>
                      Sí, cancelar envío
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Main Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Origin & Destination */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Origen y Destino
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  Origen
                </div>
                <div className="text-sm text-slate-900">
                  {shipment.originAddress.street}
                </div>
                <div className="text-sm text-slate-600">
                  {shipment.originAddress.city}, {shipment.originAddress.state}
                </div>
                <div className="text-sm text-slate-600">
                  {shipment.originAddress.postal_code}, {shipment.originAddress.country}
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  Destino
                </div>
                <div className="text-sm text-slate-900">
                  {shipment.destinationAddress.street}
                </div>
                <div className="text-sm text-slate-600">
                  {shipment.destinationAddress.city}, {shipment.destinationAddress.state}
                </div>
                <div className="text-sm text-slate-600">
                  {shipment.destinationAddress.postal_code}, {shipment.destinationAddress.country}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Fechas
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="text-sm text-slate-600">Fecha de creación</div>
                <div className="text-sm text-slate-900 text-right">
                  {formatDate(shipment.createdAt)}
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div className="text-sm text-slate-600">Entrega estimada</div>
                <div className="text-sm text-slate-900 text-right">
                  {shipment.estimatedDeliveryDate ? formatDate(shipment.estimatedDeliveryDate) : 'No definida'}
                </div>
              </div>
              {shipment.actualDeliveryDate && (
                <div className="flex justify-between items-start">
                  <div className="text-sm text-slate-600">Entrega real</div>
                  <div className="text-sm text-emerald-700 font-medium text-right">
                    {formatDate(shipment.actualDeliveryDate)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transport Info */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Información de Transporte
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="text-sm text-slate-600">Método de transporte</div>
                <div className="text-sm text-slate-900">
                  {shipment.transportMethod?.name || 'No asignado'}
                </div>
              </div>
              {shipment.driver && (
                <>
                  <div className="flex justify-between items-start">
                    <div className="text-sm text-slate-600">Conductor</div>
                    <div className="text-sm text-slate-900">
                      {shipment.driver.name}
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="text-sm text-slate-600">Teléfono</div>
                    <div className="text-sm text-slate-900">
                      {shipment.driver.phone}
                    </div>
                  </div>
                </>
              )}
              {shipment.vehicle && (
                <>
                  <div className="flex justify-between items-start">
                    <div className="text-sm text-slate-600">Vehículo</div>
                    <div className="text-sm text-slate-900">
                      {shipment.vehicle.model}
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="text-sm text-slate-600">Placa</div>
                    <div className="text-sm text-slate-900 font-mono">
                      {shipment.vehicle.licensePlate}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Cost */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Costo Total
            </h2>
            <div className="text-3xl font-semibold text-slate-900">
              {formatCurrency(shipment.totalCost)}
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Productos ({shipment.products.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                    Peso
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                    Dimensiones (cm)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {shipment.products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {product.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {product.weight} kg
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
