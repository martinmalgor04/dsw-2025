"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Truck,
  DollarSign,
  User,
  Package,
  ClipboardList,
  Users,
  Route,
  AlertTriangle,
  ShoppingCart,
  LogOut
} from 'lucide-react';
import { envConfig } from '@/app/lib/config/env.config';
import PepackLogo from '@/components/pepacklogo.jpeg';

const logo = (
  <Image
    src={PepackLogo}
    alt="PEPACK - Paquetería con sabor"
    className="w-full h-full object-contain"
    priority
  />
);

interface SidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    // Limpiar tokens locales
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    
    // Construir URL de logout de Keycloak
    const logoutUrl = `${envConfig.keycloak.url}/realms/${envConfig.keycloak.realm}/protocol/openid-connect/logout?client_id=${envConfig.keycloak.clientId}&post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
    
    // Redirigir a Keycloak logout
    window.location.href = logoutUrl;
  };

  // Items principales sin subsecciones
  const mainMenuItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'reservas', label: 'Reservas', icon: ShoppingCart, href: '/reservas' },
    { id: 'seguimiento', label: 'Seguimiento de envíos', icon: Package, href: '/operaciones/seguimiento' },
  ];

  // Secciones con subsecciones
  const menuSections = useMemo(() => [
    {
      id: 'operaciones',
      label: 'Operaciones',
      icon: ClipboardList,
      items: [
        { id: 'operaciones-hojas-ruta', label: 'Hojas de ruta / Despachos', icon: Route, href: '/operaciones/hojas-ruta' },
        { id: 'operaciones-incidencias', label: 'Incidencias y no-entregas', icon: AlertTriangle, href: '/operaciones/incidencias' },
      ]
    },
    {
      id: 'tarifas',
      label: 'Tarifas',
      icon: DollarSign,
      items: [
        { id: 'config-cotizacion', label: 'Reglas de cotización', icon: DollarSign, href: '/configuration/cotizacion' },
      ]
    },
    {
      id: 'recursos',
      label: 'Recursos',
      icon: Users,
      items: [
        { id: 'config-vehiculos', label: 'Vehículos', icon: Truck, href: '/configuration/vehiculos' },
        { id: 'recursos-conductores', label: 'Conductores', icon: User, href: '/configuration/conductores' },
        { id: 'config-transporte', label: 'Tipos de transporte', icon: Package, href: '/configuration/transporte' },
      ]
    },
  ], []);


  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const section = menuSections.find(section =>
      section.items.some(item => pathname.startsWith(item.href))
    );
    return section ? { [section.id]: true } : {};
  });

  // Actualizar secciones expandidas cuando cambia la ruta
  useEffect(() => {
    const section = menuSections.find(section =>
      section.items.some(item => pathname.startsWith(item.href))
    );
    if (section && !expandedSections[section.id]) {
      setExpandedSections(prev => ({ ...prev, [section.id]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleMobileClose = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  const handleSectionClick = (sectionId: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const isSectionActive = (sectionId: string) => {
    const section = menuSections.find(s => s.id === sectionId);
    return section?.items.some(item => pathname.startsWith(item.href)) || false;
  };

  // Glassmorphism styles using inline styles
  const glassStyle = {
    backdropFilter: 'blur(20px)',
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 12px 40px rgba(31, 38, 135, 0.2)'
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className={`p-6 border-b border-white/20 ${isCollapsed ? 'px-4' : ''}`}>
        <div className="flex items-center justify-center">
          <div className={`flex items-center justify-center ${isCollapsed ? 'w-12 h-12' : 'w-32 h-32'}`}>
            {logo}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {/* Items principales (Panel y Analíticas) */}
        {mainMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={handleMobileClose}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-xl transition-all duration-300 group relative ${isActive
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white transform translate-x-1'
                : 'text-gray-700 hover:bg-white/20 hover:translate-x-1'
                }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}

        {/* Secciones con subsecciones */}
        {menuSections.map((section) => {
          const SectionIcon = section.icon;
          const isActive = isSectionActive(section.id);
          const isExpanded = expandedSections[section.id];

          return (
            <div key={section.id}>
              <button
                onClick={() => handleSectionClick(section.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-xl text-left transition-all duration-300 group relative ${isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white transform translate-x-1'
                  : 'text-gray-700 hover:bg-white/20 hover:translate-x-1'
                  }`}
                title={isCollapsed ? section.label : undefined}
              >
                <SectionIcon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 whitespace-nowrap">{section.label}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''
                        }`}
                    />
                  </>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                    {section.label}
                  </div>
                )}
              </button>

              {/* Submenú de la sección */}
              {!isCollapsed && isExpanded && (
                <div className="mt-2 ml-4 space-y-1 animate-fade-in">
                  {section.items.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const isSubActive = pathname === subItem.href;

                    return (
                      <Link
                        key={subItem.id}
                        href={subItem.href}
                        onClick={handleMobileClose}
                        className={`w-full flex items-center gap-2 pl-8 pr-3 py-2.5 rounded-lg transition-all duration-200 border-l-2 ${isSubActive
                          ? 'bg-gradient-to-r from-purple-100 to-teal-100 text-purple-700 shadow-sm border-purple-500'
                          : 'text-gray-600 hover:bg-white/30 hover:text-gray-800 border-transparent hover:border-purple-300'
                          }`}
                      >
                        <SubIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="whitespace-nowrap text-sm">{subItem.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

      </nav>

      {/* Logout Button */}
      <div className={`p-4 border-t border-white/20 ${isCollapsed ? 'px-2' : ''}`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-xl transition-all duration-300 group relative text-red-600 hover:bg-red-100 hover:text-red-700`}
          title={isCollapsed ? 'Cerrar Sesión' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap font-medium">Cerrar Sesión</span>}

          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
              Cerrar Sesión
            </div>
          )}
        </button>
      </div>

      {/* Collapse Toggle Button - Desktop Only */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 z-10"
        title={isCollapsed ? 'Expandir' : 'Contraer'}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shadow-2xl transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-64'
          }`}
        style={glassStyle}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 lg:hidden shadow-2xl flex flex-col transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        style={glassStyle}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute -right-12 top-4 w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center text-white shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
