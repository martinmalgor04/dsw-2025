'use client';

import { useState } from 'react';
import { Search, Truck, MapPin, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { ShipmentDetail } from './types/shipment';
import { getShipmentDetails } from './services/api';
import { formatDate, formatCurrency, getStatusLabel, getStatusColor, getTransportTypeLabel } from './utils/formatters';

export default function TrackingPage() {
  const [searchInput, setSearchInput] = useState('');
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'search' | 'details'>('search');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getShipmentDetails(searchInput.trim());
      setShipment(data);
      setCurrentView('details');
    } catch (err: any) {
      setError(err.message || 'No se pudo encontrar el envío. Verifica el código e intenta nuevamente.');
      setShipment(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSearch = () => {
    setCurrentView('search');
    setShipment(null);
    setError(null);
    setSearchInput('');
  };

  const getStatusTimeline = (currentStatus: string, logStatus: string) => {
    const statusOrder = ['created', 'reserved', 'in_transit', 'arrived', 'in_distribution', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const logIndex = statusOrder.indexOf(logStatus);

    if (logIndex < currentIndex || currentStatus === 'delivered') {
      return 'completed';
    } else if (logIndex === currentIndex) {
      return 'current';
    } else {
      return 'pending';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-md flex items-center justify-center">
                <Image
                  src="/pepacklogo.jpeg"
                  alt="PEPACK - Paquetería con sabor"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Seguimiento de Envío
                </h1>
                <p className="text-xs text-slate-500">PEPACK · Paquetería con sabor</p>
              </div>
            </div>
            {currentView === 'details' && (
              <button
                onClick={handleBackToSearch}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Nueva búsqueda
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {currentView === 'search' ? (
          /* Search View */
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
                <Truck className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Rastrea tu envío
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Ingresa tu número de seguimiento para conocer el estado actual de tu pedido en tiempo real
              </p>
            </div>

            {/* Search Form */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8 md:p-10 shadow-xl">
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="tracking" className="block text-sm font-semibold text-slate-700">
                    Código de Envío
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="tracking"
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Ej: TRK12345678 o LOG-AR-123456789"
                      className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!searchInput.trim() || isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl font-semibold text-base hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Buscando...
                    </span>
                  ) : (
                    'Rastrear Envío'
                  )}
                </button>
              </form>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-red-900 mb-1">
                      Envío no encontrado
                    </h3>
                    <p className="text-sm text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>  
        ) : (
          /* Details View */
          <div className="space-y-6">
            {/* Shipment Details */}
            {shipment && !isLoading && (
              <>
                {/* Status Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 ${getStatusColor(shipment.status)} shadow-sm`}>
                          {getStatusLabel(shipment.status)}
                        </span>
                      </div>
                      <h2 className="text-3xl font-bold text-slate-900 mb-2">
                        {shipment.tracking_number || `Envío #${shipment.shipping_id}`}
                      </h2>
                      {shipment.carrier_name && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Truck className="w-4 h-4" />
                          <p className="text-sm font-medium">
                            {shipment.carrier_name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Destino</p>
                      <p className="text-sm font-medium text-slate-900">
                        {shipment.delivery_address.city}, {shipment.delivery_address.state}
                      </p>
                      <p className="text-xs text-slate-600">
                        CP: {shipment.delivery_address.postal_code}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-600 mb-1">Tipo de Transporte</p>
                      <p className="text-sm font-medium text-slate-900">
                        {getTransportTypeLabel(shipment.transport_type)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        {shipment.status === 'delivered' ? 'Fecha de Entrega' : 'ETA Estimado'}
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatDate(shipment.estimated_delivery_at)}
                      </p>
                    </div>
                  </div>

                  {/* Cost Info */}
                  {shipment.total_cost && (
                    <div className="pt-4 border-t border-slate-200 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Costo total:</span>
                        <span className="text-lg font-semibold text-slate-900">
                          {formatCurrency(shipment.total_cost, shipment.currency)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Historial de Seguimiento
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {shipment.logs.map((log, index) => {
                      const timelineStatus = getStatusTimeline(shipment.status, log.status);

                      return (
                        <div key={index} className="relative flex gap-4">
                          {/* Timeline Line */}
                          {index < shipment.logs.length - 1 && (
                            <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-slate-200" />
                          )}

                          {/* Timeline Dot */}
                          <div className="relative flex-shrink-0">
                            <div
                              className={`w-4 h-4 rounded-full border-2 ${
                                timelineStatus === 'completed'
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : timelineStatus === 'current'
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'bg-white border-slate-300'
                              }`}
                            />
                          </div>

                          {/* Event Details */}
                          <div className="flex-1 pb-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
                              <h4 className={`text-sm font-medium ${
                                timelineStatus === 'pending' ? 'text-slate-500' : 'text-slate-900'
                              }`}>
                                {log.message}
                              </h4>
                              <span className={`text-xs ${
                                timelineStatus === 'pending' ? 'text-slate-400' : 'text-slate-600'
                              }`}>
                                {formatDate(log.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
