"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { shipmentService, PublicTrackingDTO } from '@/app/lib/middleware/services/shipment.service';
import { generateMockTrackingData } from '@/app/lib/middleware/services/mock-tracking-data';

export default function TrackingPage() {
  const params = useParams();
  const id = params.id as string;

  const [tracking, setTracking] = useState<PublicTrackingDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadTracking = useCallback(async (trackingId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await shipmentService.trackShipment(trackingId);
      setTracking(data);
    } catch (err) {
      console.warn('Tracking API error, using mock data:', err);

      // Use mock data when backend is not available
      try {
        const mockData = generateMockTrackingData(trackingId);
        setTracking(mockData);
      } catch {
        setError('Envío no encontrado. Verifica el número de seguimiento.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadTracking(id);
    }
  }, [id, loadTracking]);

  useEffect(() => {
    if (autoRefresh && tracking) {
      const interval = setInterval(() => {
        loadTracking(id);
      }, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, tracking, id, loadTracking]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.location.href = `/track/${searchInput.trim()}`;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
      PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
      IN_TRANSIT: 'bg-blue-100 text-blue-700 border-blue-200',
      OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-700 border-amber-200',
      DELIVERED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      CANCELLED: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getEventStatus = (eventStatus: string, currentStatus: string) => {
    const statuses = ['PENDING', 'PROCESSING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const eventIndex = statuses.indexOf(eventStatus);
    const currentIndex = statuses.indexOf(currentStatus);

    if (eventIndex < currentIndex || currentStatus === 'DELIVERED') {
      return 'completed';
    } else if (eventIndex === currentIndex) {
      return 'current';
    } else {
      return 'pending';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadLabel = () => {
    if (tracking?.labelUrl) {
      window.open(tracking.labelUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-900">
              Seguimiento de Envío
            </h1>
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-700">
              Ir al sistema
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ingresa tu número de seguimiento"
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg border border-slate-200 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
              <div className="h-20 bg-slate-200 rounded"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-base font-semibold text-red-900 mb-2">
              Envío no encontrado
            </h3>
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Tracking Details */}
        {tracking && !isLoading && !error && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(tracking.status)}`}>
                      {tracking.statusDescription}
                    </span>
                    {autoRefresh && (
                      <span className="text-xs text-emerald-600">
                        Actualización automática activa
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {tracking.trackingNumber || tracking.id}
                  </h2>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      autoRefresh
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
                  </button>
                  {tracking.labelUrl && (
                    <button
                      onClick={handleDownloadLabel}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Descargar Etiqueta
                    </button>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Destino</p>
                  <p className="text-sm font-medium text-slate-900">
                    {tracking.destinationAddress.city}, {tracking.destinationAddress.state}
                  </p>
                  <p className="text-xs text-slate-600">
                    CP: {tracking.destinationAddress.postalCode}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-600 mb-1">Tipo de Transporte</p>
                  <p className="text-sm font-medium text-slate-900">
                    {tracking.transportMethod}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-600 mb-1">
                    {tracking.status === 'DELIVERED' ? 'Fecha de Entrega' : 'ETA Estimado'}
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {tracking.status === 'DELIVERED' && tracking.actualDeliveryDate
                      ? formatDate(tracking.actualDeliveryDate)
                      : tracking.estimatedDeliveryDate
                      ? formatDate(tracking.estimatedDeliveryDate)
                      : 'No disponible'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-6">
                Historial de Seguimiento
              </h3>

              <div className="space-y-6">
                {tracking.events.map((event, index) => {
                  const eventStatusType = getEventStatus(event.status, tracking.status);

                  return (
                    <div key={index} className="relative flex gap-4">
                      {/* Timeline Line */}
                      {index < tracking.events.length - 1 && (
                        <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-slate-200" />
                      )}

                      {/* Timeline Dot */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            eventStatusType === 'completed'
                              ? 'bg-emerald-500 border-emerald-500'
                              : eventStatusType === 'current'
                              ? 'bg-blue-500 border-blue-500'
                              : 'bg-white border-slate-300'
                          }`}
                        />
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
                          <h4 className={`text-sm font-medium ${
                            eventStatusType === 'pending' ? 'text-slate-500' : 'text-slate-900'
                          }`}>
                            {event.description}
                          </h4>
                          <span className={`text-xs ${
                            eventStatusType === 'pending' ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                        {event.location && (
                          <p className={`text-xs ${
                            eventStatusType === 'pending' ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
