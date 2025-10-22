import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Analitica } from "./pages/Analitica";
import { Configuration } from "./pages/Configuration";
import { Toaster } from "./components/ui/sonner";
import { Menu } from "lucide-react";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Determinar el tab activo basado en la ruta actual
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/") return "dashboard";
    if (path === "/analitica") return "analytics";
    if (path.startsWith("/config")) return path.replace("/config-", "config-");
    return "dashboard";
  };

  const activeTab = getActiveTab();

  const handleNavigation = (tabId: string) => {
    if (tabId === "dashboard") {
      navigate("/");
    } else if (tabId === "analytics") {
      navigate("/analitica");
    } else if (tabId.startsWith("config-")) {
      navigate(`/config-${tabId.replace("config-", "")}`);
    }
  };

  const glassStyle = {
    backdropFilter: 'blur(16px)',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 p-4" style={glassStyle}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white shadow-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
            PEPACK
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="relative z-10 flex pt-20 lg:pt-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleNavigation}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />
        <main className={`flex-1 p-4 md:p-6 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'
          }`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analitica" element={<Analitica />} />
            <Route path="/config-vehiculos" element={<Configuration activeSubPage="config-vehiculos" />} />
            <Route path="/config-cotizacion" element={<Configuration activeSubPage="config-cotizacion" />} />
            <Route path="/config-motivos" element={<Configuration activeSubPage="config-motivos" />} />
            <Route path="/config-roles" element={<Configuration activeSubPage="config-roles" />} />
            <Route path="/config-usuarios" element={<Configuration activeSubPage="config-usuarios" />} />
            <Route path="/config-centros-stock" element={<Configuration activeSubPage="config-centros-stock" />} />
            <Route path="/config-transporte" element={<Configuration activeSubPage="config-transporte" />} />
          </Routes>
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            backdropFilter: 'blur(16px)',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          },
        }}
      />

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
