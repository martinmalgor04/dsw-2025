"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { routeService, RouteDTO } from '@/lib/middleware/services/route.service';

export default function HojasRutaPage() {
  const [routes, setRoutes] = useState<RouteDTO[]>([]);
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
    loadRoutes();
  }, [page, filters]);

  const loadRoutes = async () => {
    setIsLoading(true);
    try {
      const data = await routeService.getRoutes();
      setRoutes(data);
      // Mock pagination
      setTotalPages(Math.ceil(data.length / 20));
    } catch (err) {
      console.error('Error loading routes:', err);
      // Generate mock data for development
      setRoutes(generateMockRoutes());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockRoutes = (): RouteDTO[] => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `route-${i + 1}`,
      name: `Ruta ${i + 1} - Zona ${['Norte', 'Sur', 'Este', 'Oeste'][i % 4]}`,
      description: `Descripción de la ruta ${i + 1}`,
      status: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'][i % 4],
      startDate: new Date(Date.now() - (i * 86400000)).toISOString(),
      endDate: new Date(Date.now() + (i * 86400000)).toISOString(),
      transportMethod: {
        id: `tm-${i % 3 + 1}`,
        code: ['ground', 'air', 'sea'][i % 3],
        name: ['Terrestre', 'Aéreo', 'Marítimo'][i % 3],
        averageSpeed: [60, 800, 30][i % 3],
        estimatedDays: '1-2',
        baseCostPerKm: [0.5, 2.0, 1.0][i % 3],
        baseCostPerKg: [0.1, 0.5, 0.2][i % 3],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      vehicle: i % 2 === 0 ? {
        id: `vehicle-${i + 1}`,
        license_plate: `ABC-${123 + i}`,
        make: 'Mercedes-Benz',
        model: 'Sprinter',
        year: 2020 + (i % 5),
        capacityKg: 1000,
        volumeM3: 20,
        fuelType: 'DIESEL',
        status: 'AVAILABLE'
      } : undefined,
      driver: i % 2 === 0 ? {
        id: `driver-${i + 1}`,
        employeeId: `DRV-${100 + i}`,
        firstName: ['Juan', 'María', 'Carlos', 'Ana'][i % 4],
        lastName: ['Pérez', 'García', 'López', 'Martínez'][i % 4],
        email: `driver${i + 1}@example.com`,
        phone: `+54 11 ${4000 + i}`,
        licenseNumber: `LIC-${1000 + i}`,
        licenseType: ['A', 'B', 'C', 'D'][i % 4] as 'A' | 'B' | 'C' | 'D',
        status: 'ACTIVE'
      } : undefined
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
      PLANNED: 'bg-slate-100 text-slate-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-emerald-100 text-emerald-700',
      CANCELLED: 'bg-red-100 text-red-700'
    };
    const labels: Record<string, string> = {
      PLANNED: 'Planificada',
      IN_PROGRESS: 'En Progreso',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badges[status] || badges.PLANNED}`}>
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

  const filteredRoutes = routes.filter(route => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        route.id.toLowerCase().includes(search) ||
        route.name.toLowerCase().includes(search) ||
        route.description?.toLowerCase().includes(search)
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
            Hojas de Ruta / Despachos
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestión de rutas de distribución y despachos
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
                placeholder="ID, nombre, descripción..."
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
                <option value="PLANNED">Planificada</option>
                <option value="IN_PROGRESS">En Progreso</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
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
              {filteredRoutes.length} resultado{filteredRoutes.length !== 1 ? 's' : ''}
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
          ) : filteredRoutes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-600">No se encontraron rutas</p>
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
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                      Vehículo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                      Conductor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                      Transporte
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                      Fecha Inicio
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRoutes.map((route) => (
                    <tr
                      key={route.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm font-mono text-slate-900">
                        {route.id.slice(0, 10)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {route.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(route.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {route.vehicle?.license_plate || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {route.driver ? `${route.driver.firstName} ${route.driver.lastName}` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {route.transportMethod?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(route.startDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <Link
                          href={`/operaciones/hojas-ruta/${route.id}`}
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
