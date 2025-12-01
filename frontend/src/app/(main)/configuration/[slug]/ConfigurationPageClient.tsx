"use client";

import React from "react";
import { Vehiculos } from "@/components/config-pages/Vehiculos";
import { ReglasCotizacion } from "@/components/config-pages/ReglasCotizacion";
import { TiposTransporte } from "@/components/config-pages/TiposTransporte";
import { Conductores } from "@/components/config-pages/Conductores";

interface ConfigPageClientProps {
  slug: string;
  title: string;
  description: string;
}

// Mapeo de slugs a componentes
const componentMap: Record<string, React.ComponentType> = {
  vehiculos: Vehiculos,
  cotizacion: ReglasCotizacion,
  transporte: TiposTransporte,
  conductores: Conductores,
};

export function ConfigurationPageClient({ slug, title, description }: ConfigPageClientProps) {
  const Component = componentMap[slug];

  if (!Component) {
    return <div>Página no encontrada</div>;
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-semibold text-purple-600 tracking-tight">
          {title}
        </h1>
        <p className="text-gray-600 mt-2 text-base md:text-lg">
          {description}
        </p>
      </div>

      {/* Content */}
      <Component />
    </div>
  );
}
