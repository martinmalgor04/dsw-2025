import React from "react";
import { ZonasCobertura } from "../components/config-pages/ZonasCobertura";
import { Vehiculos } from "../components/config-pages/Vehiculos";
import { VentanasOperativas } from "../components/config-pages/VentanasOperativas";
import { ReglasCotizacion } from "../components/config-pages/ReglasCotizacion";
import { MotivosNoEntrega } from "../components/config-pages/MotivosNoEntrega";
import { RolesPermisos } from "../components/config-pages/RolesPermisos";
import { UsuariosConfig } from "../components/config-pages/UsuariosConfig";
import { TiposTransporte } from "../components/config-pages/TiposTransporte";

interface ConfigurationProps {
  activeSubPage: string;
}

export function Configuration({ activeSubPage }: ConfigurationProps) {

  const getTitleBySubPage = () => {
    const titles: Record<string, string> = {
      'config-zonas': 'Zonas de cobertura',
      'config-vehiculos': 'Vehículos',
      'config-ventanas': 'Ventanas operativas',
      'config-cotizacion': 'Reglas de cotización',
      'config-motivos': 'Motivos de no entrega',
      'config-roles': 'Roles y permisos',
      'config-usuarios': 'Usuarios',
      'config-transporte': 'Tipos de transporte',
    };
    return titles[activeSubPage] || 'Configuración';
  };

  const renderSubPage = () => {
    switch (activeSubPage) {
      case 'config-zonas':
        return <ZonasCobertura />;
      case 'config-vehiculos':
        return <Vehiculos />;
      case 'config-ventanas':
        return <VentanasOperativas />;
      case 'config-cotizacion':
        return <ReglasCotizacion />;
      case 'config-motivos':
        return <MotivosNoEntrega />;
      case 'config-roles':
        return <RolesPermisos />;
      case 'config-usuarios':
        return <UsuariosConfig />;
      case 'config-transporte':
        return <TiposTransporte />;
      default:
        return <ZonasCobertura />;
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm mb-3">
          <span className="text-gray-500">Configuración</span>
          <span className="text-gray-400">/</span>
          <span className="text-purple-700">{getTitleBySubPage()}</span>
        </div>
        <h1 className="bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
          {getTitleBySubPage()}
        </h1>
        <p className="text-gray-600 mt-1">
          Gestiona la configuración de {getTitleBySubPage().toLowerCase()}
        </p>
      </div>

      {/* Content */}
      {renderSubPage()}
    </div>
  );
}
