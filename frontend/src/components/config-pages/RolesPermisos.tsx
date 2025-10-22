import React, { useState } from "react";
import { Shield, Plus, Copy, Check, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import { toast } from "sonner";

interface Rol {
  id: string;
  nombre: string;
  permisos: Record<string, string[]>;
  activo: boolean;
}

const recursos = [
  { id: "ordenes", label: "Órdenes" },
  { id: "rutas", label: "Rutas" },
  { id: "inventario", label: "Inventario" },
  { id: "cotizacion", label: "Cotización" },
  { id: "usuarios", label: "Usuarios" },
  { id: "config", label: "Configuración" },
];

const acciones = ["read", "create", "update", "delete", "export"];

const mockRoles: Rol[] = [
  {
    id: "1",
    nombre: "Admin",
    permisos: {
      ordenes: ["read", "create", "update", "delete", "export"],
      rutas: ["read", "create", "update", "delete", "export"],
      inventario: ["read", "create", "update", "delete", "export"],
      cotizacion: ["read", "create", "update", "delete"],
      usuarios: ["read", "create", "update", "delete"],
      config: ["read", "update"],
    },
    activo: true,
  },
  {
    id: "2",
    nombre: "Operador CD",
    permisos: {
      ordenes: ["read", "update"],
      rutas: ["read"],
      inventario: ["read", "update"],
      cotizacion: ["read"],
      usuarios: [],
      config: [],
    },
    activo: true,
  },
  {
    id: "3",
    nombre: "Transportista",
    permisos: {
      ordenes: ["read", "update"],
      rutas: ["read"],
      inventario: [],
      cotizacion: [],
      usuarios: [],
      config: [],
    },
    activo: true,
  },
  {
    id: "4",
    nombre: "Viewer",
    permisos: {
      ordenes: ["read"],
      rutas: ["read"],
      inventario: ["read"],
      cotizacion: ["read"],
      usuarios: [],
      config: [],
    },
    activo: true,
  },
];

export function RolesPermisos() {
  const [roles, setRoles] = useState<Rol[]>(mockRoles);
  const [selectedRolId, setSelectedRolId] = useState(roles[0].id);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [nuevoRolNombre, setNuevoRolNombre] = useState("");

  const selectedRol = roles.find(r => r.id === selectedRolId);

  const togglePermiso = (recurso: string, accion: string) => {
    if (!selectedRol) return;

    setRoles(roles.map(rol => {
      if (rol.id === selectedRolId) {
        const permisos = { ...rol.permisos };
        const permisosRecurso = permisos[recurso] || [];
        
        if (permisosRecurso.includes(accion)) {
          permisos[recurso] = permisosRecurso.filter(a => a !== accion);
        } else {
          permisos[recurso] = [...permisosRecurso, accion];
        }
        
        return { ...rol, permisos };
      }
      return rol;
    }));
  };

  const handleGuardar = () => {
    toast.success("Permisos guardados correctamente");
  };

  const handleCrearRol = () => {
    if (!nuevoRolNombre.trim()) {
      toast.error("El nombre del rol es requerido");
      return;
    }

    const nuevoRol: Rol = {
      id: String(Date.now()),
      nombre: nuevoRolNombre,
      permisos: {},
      activo: true,
    };

    setRoles([...roles, nuevoRol]);
    setSelectedRolId(nuevoRol.id);
    setIsCreatingNew(false);
    setNuevoRolNombre("");
    toast.success("Rol creado correctamente");
  };

  const handleClonarRol = () => {
    if (!selectedRol) return;

    const clonado: Rol = {
      id: String(Date.now()),
      nombre: `${selectedRol.nombre} (Copia)`,
      permisos: { ...selectedRol.permisos },
      activo: true,
    };

    setRoles([...roles, clonado]);
    setSelectedRolId(clonado.id);
    toast.success("Rol clonado correctamente");
  };

  const tienePermiso = (recurso: string, accion: string) => {
    return selectedRol?.permisos[recurso]?.includes(accion) || false;
  };

  const getPermisosClave = (rol: Rol) => {
    const total = Object.values(rol.permisos).flat().length;
    return total;
  };

  const glassStyle = {
    backdropFilter: 'blur(16px)',
    background: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-800 mb-1">Roles y Permisos</h2>
          <p className="text-gray-600">
            Gestiona los roles y sus permisos de acceso
          </p>
        </div>
        <div className="flex gap-2">
          {selectedRol && (
            <Button
              variant="outline"
              onClick={handleClonarRol}
              className="border-purple-200/50"
            >
              <Copy className="w-4 h-4 mr-2" />
              Clonar rol
            </Button>
          )}
          <Button
            onClick={() => setIsCreatingNew(true)}
            className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo rol
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lista de Roles */}
        <div className="lg:col-span-1">
          <div className="p-4 rounded-xl" style={glassStyle}>
            <h3 className="text-gray-800 mb-4">Roles</h3>
            <div className="space-y-2">
              {roles.map((rol) => (
                <button
                  key={rol.id}
                  onClick={() => setSelectedRolId(rol.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    selectedRolId === rol.id
                      ? "bg-gradient-to-r from-purple-600 to-teal-600 text-white shadow-lg"
                      : "bg-white/50 hover:bg-white/80 text-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>{rol.nombre}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {getPermisosClave(rol)}
                    </Badge>
                  </div>
                </button>
              ))}

              {isCreatingNew && (
                <div className="p-3 bg-white/80 rounded-lg space-y-2">
                  <Input
                    value={nuevoRolNombre}
                    onChange={(e) => setNuevoRolNombre(e.target.value)}
                    placeholder="Nombre del rol"
                    className="bg-white"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCrearRol} className="flex-1">
                      <Check className="w-3 h-3 mr-1" />
                      Crear
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setNuevoRolNombre("");
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Matriz de Permisos */}
        <div className="lg:col-span-3">
          <div className="p-6 rounded-xl" style={glassStyle}>
            {selectedRol ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-gray-800">Permisos para: {selectedRol.nombre}</h3>
                    <p className="text-sm text-gray-600">
                      {getPermisosClave(selectedRol)} permisos activos
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-purple-200">
                        <th className="text-left py-3 px-4 text-gray-700">Recurso</th>
                        {acciones.map((accion) => (
                          <th key={accion} className="text-center py-3 px-4 text-gray-700 capitalize">
                            {accion === "read" ? "Ver" :
                             accion === "create" ? "Crear" :
                             accion === "update" ? "Editar" :
                             accion === "delete" ? "Eliminar" :
                             "Exportar"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recursos.map((recurso) => (
                        <tr key={recurso.id} className="border-b border-purple-100 hover:bg-white/50">
                          <td className="py-3 px-4 text-gray-800">{recurso.label}</td>
                          {acciones.map((accion) => (
                            <td key={accion} className="text-center py-3 px-4">
                              <Checkbox
                                checked={tienePermiso(recurso.id, accion)}
                                onCheckedChange={() => togglePermiso(recurso.id, accion)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 pt-6 border-t border-purple-200">
                  <h4 className="text-gray-800 mb-3">Resumen del rol</h4>
                  <div className="flex flex-wrap gap-2">
                    {recursos.map((recurso) => {
                      const permisos = selectedRol.permisos[recurso.id] || [];
                      if (permisos.length === 0) return null;
                      return (
                        <Badge
                          key={recurso.id}
                          variant="outline"
                          className="bg-purple-100 border-purple-300 text-purple-700"
                        >
                          {recurso.label}: {permisos.join(", ")}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleGuardar}
                    className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white"
                  >
                    Guardar cambios
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Selecciona un rol para editar sus permisos
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
