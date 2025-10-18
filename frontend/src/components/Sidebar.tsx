import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  MapPin,
  Truck,
  Clock,
  DollarSign,
  XOctagon,
  Shield,
  User,
  Package,
  BrainCircuit,
  Info
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}: SidebarProps) {
  const isConfigPage = activeTab.startsWith('config-');
  const [configExpanded, setConfigExpanded] = useState(isConfigPage);

  // Expandir automáticamente configuración si estamos en una subpágina
  useEffect(() => {
    if (isConfigPage) {
      setConfigExpanded(true);
    }
  }, [isConfigPage]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const configSubItems = [
    { id: 'config-zonas', label: 'Zonas de cobertura', icon: MapPin },
    { id: 'config-vehiculos', label: 'Vehículos', icon: Truck },
    { id: 'config-ventanas', label: 'Ventanas operativas', icon: Clock },
    { id: 'config-cotizacion', label: 'Reglas de cotización', icon: DollarSign },
    { id: 'config-motivos', label: 'Motivos de no entrega', icon: XOctagon },
    { id: 'config-roles', label: 'Roles y permisos', icon: Shield },
    { id: 'config-usuarios', label: 'Usuarios', icon: User },
    { id: 'config-transporte', label: 'Tipos de transporte', icon: Package },
  ];

  // Glassmorphism styles using inline styles
  const glassStyle = {
    backdropFilter: 'blur(20px)',
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 12px 40px rgba(31, 38, 135, 0.2)'
  };

  const handleMenuItemClick = (tabId: string) => {
    setActiveTab(tabId);
    // Close mobile menu after selection
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  const handleConfigClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    setConfigExpanded(!configExpanded);
  };

  const isConfigActive = activeTab.startsWith('config-');

  const sidebarContent = (
    <>
      {/* Header */}
      <div className={`p-6 border-b border-white/20 ${isCollapsed ? 'px-4' : ''}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg text-gray-800 whitespace-nowrap">LogiX</h1>
              <p className="text-xs text-gray-600 whitespace-nowrap">Sistema de Logística</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleMenuItemClick(item.id)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-xl text-left transition-all duration-300 group relative ${isActive
                ? 'bg-gradient-to-r from-purple-500 to-teal-500 text-white transform translate-x-1'
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
            </button>
          );
        })}

        {/* Configuración con submenú */}
        <div>
          <button
            onClick={handleConfigClick}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-xl text-left transition-all duration-300 group relative ${isConfigActive
              ? 'bg-gradient-to-r from-purple-500 to-teal-500 text-white transform translate-x-1'
              : 'text-gray-700 hover:bg-white/20 hover:translate-x-1'
              }`}
            title={isCollapsed ? 'Configuración' : undefined}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 whitespace-nowrap">Configuración</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${configExpanded ? 'rotate-180' : ''
                    }`}
                />
              </>
            )}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                Configuración
              </div>
            )}
          </button>

          {/* Submenú de Configuración */}
          {!isCollapsed && configExpanded && (
            <div className="mt-2 ml-4 space-y-1 animate-fade-in">
              {configSubItems.map((subItem) => {
                const SubIcon = subItem.icon;
                const isActive = activeTab === subItem.id;

                return (
                  <button
                    key={subItem.id}
                    onClick={() => handleMenuItemClick(subItem.id)}
                    className={`w-full flex items-center gap-2 pl-8 pr-3 py-2.5 rounded-lg transition-all duration-200 border-l-2 ${isActive
                      ? 'bg-gradient-to-r from-purple-100 to-teal-100 text-purple-700 shadow-sm border-purple-500'
                      : 'text-gray-600 hover:bg-white/30 hover:text-gray-800 border-transparent hover:border-purple-300'
                      }`}
                  >
                    <SubIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap text-sm">{subItem.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Backend Status */}
      <div className={`p-4 border-t border-white/20 ${isCollapsed ? 'px-2' : ''}`}>
        {isCollapsed ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Info className="w-4 h-4 text-blue-700" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-blue-100 text-blue-700 border border-blue-200">
            <Info className="w-4 h-4" />
            <span>Demo Mode</span>
          </div>
        )}
      </div>

      {/* Collapse Toggle Button - Desktop Only */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-gradient-to-br from-purple-500 to-teal-500 rounded-full items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 z-10"
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
          className="absolute -right-12 top-4 w-10 h-10 bg-gradient-to-br from-purple-500 to-teal-500 rounded-full flex items-center justify-center text-white shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}