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
      "config-zonas": "Zonas de cobertura",
      "config-vehiculos": "Vehiculos",
      "config-ventanas": "Ventanas operativas",
      "config-cotizacion": "Reglas de cotizacion",
      "config-motivos": "Motivos de no entrega",
      "config-roles": "Roles y permisos",
      "config-usuarios": "Usuarios",
      "config-transporte": "Tipos de transporte",
    };
    return titles[activeSubPage] || "Configuracion";
  };

  const renderSubPage = () => {
    switch (activeSubPage) {
      case "config-zonas":
        return <ZonasCobertura />;
      case "config-vehiculos":
        return <Vehiculos />;
      case "config-ventanas":
        return <VentanasOperativas />;
      case "config-cotizacion":
        return <ReglasCotizacion />;
      case "config-motivos":
        return <MotivosNoEntrega />;
      case "config-roles":
        return <RolesPermisos />;
      case "config-usuarios":
        return <UsuariosConfig />;
      case "config-transporte":
        return <TiposTransporte />;
      default:
        return <ZonasCobertura />;
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-semibold text-purple-600 tracking-tight">
          {getTitleBySubPage()}
        </h1>
        <p className="text-gray-600 mt-2 text-base md:text-lg">
          Gestiona la configuracion de {getTitleBySubPage().toLowerCase()}
        </p>
      </div>

      {/* Content */}
      {renderSubPage()}
    </div>
  );
}
