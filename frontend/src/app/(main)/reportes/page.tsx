"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  Legend
} from 'recharts';
import { useReports } from '@/app/lib/middleware/stores/composables/useReports';
import { toast } from 'sonner';

type DateRangeOption = 'today' | '7d' | '30d' | 'custom';

export default function ReportesPage() {
  const {
    kpiData,
    isLoading,
    error,
    autoRefresh,
    loadKPIs,
    setAutoRefresh,
    exportToCSV
  } = useReports();

  const [selectedRange, setSelectedRange] = useState<DateRangeOption>('30d');
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('month');
  const [customDateRange] = useState({ from: '', to: '' });

  const loadData = useCallback((force = false) => {
    let period = undefined;

    if (selectedRange === 'custom' && customDateRange.from && customDateRange.to) {
      period = { from: customDateRange.from, to: customDateRange.to };
    }

    loadKPIs(period, force);
  }, [selectedRange, customDateRange, loadKPIs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadData(true);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadData]);

  const handleRangeChange = (range: DateRangeOption) => {
    setSelectedRange(range);
    if (range !== 'custom') {
      loadData();
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportToCSV();
      toast.success('Reporte exportado exitosamente');
    } catch {
      toast.error('Error al exportar el reporte');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg p-6 bg-red-50 border border-red-200">
            <h2 className="text-base font-semibold text-red-900 mb-2">Error al cargar los reportes</h2>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              onClick={() => loadData(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Dashboard de Reportes
            </h1>
            <p className="text-sm text-slate-600 mt-1">Métricas operativas y KPIs de envíos</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-1">
              <button
                onClick={() => handleRangeChange('today')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  selectedRange === 'today'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => handleRangeChange('7d')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  selectedRange === '7d'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                7 días
              </button>
              <button
                onClick={() => handleRangeChange('30d')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  selectedRange === '30d'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                30 días
              </button>
            </div>

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

            <button
              onClick={handleExportCSV}
              disabled={!kpiData || isLoading}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && !kpiData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg p-4 animate-pulse bg-white border border-slate-200">
                  <div className="h-3 bg-slate-200 rounded w-1/2 mb-3"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        {kpiData && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Shipments */}
              <div className="rounded-lg bg-white border border-slate-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Total de Envíos
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveTab('today')}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                        activeTab === 'today'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      D
                    </button>
                    <button
                      onClick={() => setActiveTab('week')}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                        activeTab === 'week'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      S
                    </button>
                    <button
                      onClick={() => setActiveTab('month')}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                        activeTab === 'month'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      M
                    </button>
                  </div>
                </div>
                <div className="text-3xl font-semibold text-slate-900">
                  {activeTab === 'today' && kpiData.totalShipments.today.toLocaleString()}
                  {activeTab === 'week' && kpiData.totalShipments.week.toLocaleString()}
                  {activeTab === 'month' && kpiData.totalShipments.month.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {activeTab === 'today' && 'En el día de hoy'}
                  {activeTab === 'week' && 'En los últimos 7 días'}
                  {activeTab === 'month' && 'En los últimos 30 días'}
                </div>
              </div>

              {/* Delivery Success Rate - DESTACADO */}
              <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white">
                <span className="text-xs font-medium uppercase tracking-wide opacity-90">
                  Tasa de Entrega Exitosa
                </span>
                <div className="text-3xl font-semibold mt-2">
                  {kpiData.deliverySuccessRate.toFixed(1)}%
                </div>
                <div className="text-xs opacity-90 mt-1">
                  Objetivo: 95%
                </div>
              </div>

              {/* Average Delivery Time */}
              <div className="rounded-lg bg-white border border-slate-200 p-4">
                <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Tiempo Promedio de Entrega
                </span>
                <div className="text-3xl font-semibold text-slate-900 mt-2">
                  {kpiData.averageDeliveryTime.toFixed(1)}<span className="text-xl text-slate-600">h</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Desde el despacho
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Timeline Chart */}
              <div className="rounded-lg bg-white border border-slate-200 p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Evolución de Envíos
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">Últimos 30 días</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpiData.timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#E2E8F0' }}
                      />
                      <YAxis
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#E2E8F0' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px' }}
                        iconType="circle"
                      />
                      <Line
                        type="monotone"
                        dataKey="shipments"
                        stroke="#2563EB"
                        strokeWidth={2}
                        dot={false}
                        name="Total Envíos"
                      />
                      <Line
                        type="monotone"
                        dataKey="delivered"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={false}
                        name="Entregados"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Transport Type Distribution - Changed to horizontal bars */}
              <div className="rounded-lg bg-white border border-slate-200 p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Distribución por Tipo de Transporte
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">Comparativa por método</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpiData.transportTypeDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#E2E8F0' }}
                      />
                      <YAxis
                        dataKey="type"
                        type="category"
                        stroke="#94A3B8"
                        fontSize={11}
                        width={120}
                        tickLine={false}
                        axisLine={{ stroke: '#E2E8F0' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value, name, props) => [
                          `${value} envíos (${props.payload.percentage.toFixed(1)}%)`,
                          ''
                        ]}
                      />
                      <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Distribution */}
              <div className="rounded-lg bg-white border border-slate-200 p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Envíos por Estado
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">Estado actual de los envíos</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpiData.statusDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#E2E8F0' }}
                      />
                      <YAxis
                        dataKey="status"
                        type="category"
                        stroke="#94A3B8"
                        fontSize={11}
                        width={100}
                        tickLine={false}
                        axisLine={{ stroke: '#E2E8F0' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="count" fill="#64748B" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top 5 Zones */}
              <div className="rounded-lg bg-white border border-slate-200 p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Top 5 Zonas con Más Envíos
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">Zonas de mayor actividad</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpiData.topZones}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="zone"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#E2E8F0' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#E2E8F0' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="shipments" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
