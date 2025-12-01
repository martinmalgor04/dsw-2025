"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function TrackSearchPage() {
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.location.href = `/track/${searchInput.trim()}`;
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-slate-900 mb-4">
            Rastrea tu envío
          </h2>
          <p className="text-slate-600">
            Ingresa tu número de seguimiento para conocer el estado de tu pedido
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="tracking" className="block text-sm font-medium text-slate-700 mb-2">
                Número de Seguimiento
              </label>
              <input
                id="tracking"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Ej: TRK12345678 o ID del envío"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={!searchInput.trim()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rastrear Envío
            </button>
          </form>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <div className="w-5 h-5 border-2 border-blue-600 rounded-full" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Seguimiento en Tiempo Real
            </h3>
            <p className="text-xs text-slate-600">
              Consulta el estado actualizado de tu envío en cualquier momento
            </p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
              <div className="w-5 h-5 border-2 border-emerald-600 rounded" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Historial Completo
            </h3>
            <p className="text-xs text-slate-600">
              Visualiza todos los eventos y ubicaciones de tu paquete
            </p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
              <div className="w-5 h-5 border-2 border-amber-600 rounded-lg" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              ETA Estimado
            </h3>
            <p className="text-xs text-slate-600">
              Conoce la fecha estimada de entrega de tu pedido
            </p>
          </div>
        </div>

        {/* Example IDs for testing */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-600 mb-3">
            Prueba con estos IDs de ejemplo:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSearchInput('abc123')}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-xs hover:bg-slate-200 transition-colors"
            >
              abc123
            </button>
            <button
              onClick={() => setSearchInput('def456')}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-xs hover:bg-slate-200 transition-colors"
            >
              def456
            </button>
            <button
              onClick={() => setSearchInput('ghi789')}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-xs hover:bg-slate-200 transition-colors"
            >
              ghi789
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
