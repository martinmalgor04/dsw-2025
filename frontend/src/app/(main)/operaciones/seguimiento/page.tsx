"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { shipmentService, ShipmentDTO } from '@/app/lib/middleware/services/shipment.service';

export default function SeguimientoPage() {
  const [shipments, setShipments] = useState<ShipmentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadShipments();
  }, [page, filters]);

  const loadShipments = async () => {
    setIsLoading(true);
    try {
      const data = await shipmentService.getShipments({
        status: filters.status || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      });
      setShipments(data);
      // Mock pagination
      setTotalPages(Math.ceil(data.length / 20));
    } catch (err) {
      console.error('Error loading shipments:', err);
      // Generate mock data for development
      setShipments(generateMockShipments());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockShipments = (): ShipmentDTO[] => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: `ship-${i + 1}`,
      orderId: 1000 + i,
      originAddress: {
        street: 'Calle 100 #15-20',
        city: 'Bogotá',
        state: 'Cundinamarca',
        postal_code: '110111',
        country: 'Colombia'
      },
      destinationAddress: {
        street: 'Carrera 43A #14-58',
        city: ['Medellín', 'Cali', 'Barranquilla', 'Cartagena'][i % 4],
        state: ['Antioquia', 'Valle', 'Atlántico', 'Bolívar'][i % 4],
        postal_code: '050001',
        country: 'Colombia'
      },
      products: [],
      transportMethod: {
        id: `tm-${i % 4 + 1}`,
        name: ['Terrestre Express', 'Terrestre Estándar', 'Aéreo', 'Marítimo'][i % 4]
      },
      status: ['PENDING', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED'][i % 4],
      totalCost: 50000 + (i * 10000),
      createdAt: new Date(Date.now() - (i * 86400000)).toISOString(),
      estimatedDeliveryDate: new Date(Date.now() + (i * 86400000)).toISOString()
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    setPage(1);
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
      <span className={`px-2 py-1 rounded text-xs font-medium ${badges[status] || badges.PENDING}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredShipments = shipments.filter(shipment => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        shipment.id.toLowerCase().includes(search) ||
        shipment.orderId.toString().includes(search) ||
        shipment.destinationAddress.city.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Seguimiento de Envíos
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestión y seguimiento de todos los envíos
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Buscar
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="ID, orden, ciudad..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="PENDING">Pendiente</option>
                <option value="PROCESSING">Procesando</option>
                <option value="IN_TRANSIT">En Tránsito</option>
                <option value="DELIVERED">Entregado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Desde
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Hasta
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <button
              onClick={handleClearFilters}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Limpiar filtros
            </button>
            <div className="text-sm text-slate-600">
              {filteredShipments.length} resultado{filteredShipments.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-slate-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-600">No se encontraron envíos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                      Orden
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                      Destino
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                      Transporte
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                      ETA
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredShipments.map((shipment) => (
                    <tr
                      key={shipment.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/operaciones/seguimiento/${shipment.id}`}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-slate-900">
                        {shipment.id.slice(0, 10)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        #{shipment.orderId}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {shipment.destinationAddress.city}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(shipment.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {shipment.transportMethod?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {shipment.estimatedDeliveryDate ? formatDate(shipment.estimatedDeliveryDate) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(shipment.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <Link
                          href={`/operaciones/seguimiento/${shipment.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver detalles
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-slate-600">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
