import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Copy, Power, Trash2, Map } from "lucide-react";
import { DataTable, createSortableHeader } from "../config/DataTable";
import { Toolbar } from "../config/Toolbar";
import { BadgeEstado } from "../config/BadgeEstado";
import { ConfirmDialog } from "../config/ConfirmDialog";
import { EmptyState } from "../config/EmptyState";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";

interface Zona {
  id: string;
  nombre: string;
  modo: "polygon" | "zip";
  cobertura: string;
  activo: boolean;
  ultimaActualizacion: string;
}

const mockZonas: Zona[] = [
  {
    id: "1",
    nombre: "CABA Oeste",
    modo: "polygon",
    cobertura: "3 polígonos",
    activo: true,
    ultimaActualizacion: "2025-10-15",
  },
  {
    id: "2",
    nombre: "Rosario Centro",
    modo: "zip",
    cobertura: "25 CPs",
    activo: true,
    ultimaActualizacion: "2025-10-14",
  },
];

export function ZonasCobertura() {
  const [searchValue, setSearchValue] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterModo, setFilterModo] = useState("todos");
  const [zonas, setZonas] = useState<Zona[]>(mockZonas);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZona, setEditingZona] = useState<Zona | null>(null);
  const [deleteZona, setDeleteZona] = useState<Zona | null>(null);
  const [modalTab, setModalTab] = useState("polygon");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    modo: "polygon" as "polygon" | "zip",
    activo: true,
    cps: "",
  });

  // Función para validar códigos postales argentinos
  const validarCPArgentino = (cp: string): boolean => {
    // Códigos postales argentinos: 4 dígitos, empiezan con 1-9
    const cpRegex = /^[1-9]\d{3}$/;
    return cpRegex.test(cp.trim());
  };

  // Función para validar y normalizar lista de CPs
  const validarYNormalizarCPs = (inputCPs: string): { validos: string[], invalidos: string[] } => {
    const cps = inputCPs.split(/[,;\n]/)
      .map(cp => cp.trim())
      .filter(cp => cp.length > 0);

    const validos: string[] = [];
    const invalidos: string[] = [];

    cps.forEach(cp => {
      if (validarCPArgentino(cp)) {
        // Normalizar a 4 dígitos con cero a la izquierda si es necesario
        validos.push(cp.padStart(4, '0'));
      } else {
        invalidos.push(cp);
      }
    });

    return { validos, invalidos };
  };

  const filteredZonas = zonas.filter((zona) => {
    const matchesSearch = zona.nombre.toLowerCase().includes(searchValue.toLowerCase());
    const matchesEstado = filterEstado === "todos" ||
      (filterEstado === "activo" && zona.activo) ||
      (filterEstado === "inactivo" && !zona.activo);
    const matchesModo = filterModo === "todos" || zona.modo === filterModo;
    return matchesSearch && matchesEstado && matchesModo;
  });

  const handleNew = () => {
    setEditingZona(null);
    setFormData({ nombre: "", modo: "polygon", activo: true, cps: "" });
    setModalTab("polygon");
    setIsModalOpen(true);
  };

  const handleEdit = (zona: Zona) => {
    setEditingZona(zona);
    setFormData({
      nombre: zona.nombre,
      modo: zona.modo,
      activo: zona.activo,
      cps: "", // En una implementación real, aquí cargaríamos los CPs desde la zona
    });
    setModalTab(zona.modo);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setValidationErrors([]);
    setIsLoading(true);

    try {
      // Validación del nombre
      if (!formData.nombre.trim()) {
        toast.error("El nombre es requerido");
        return;
      }

      // Validación específica para modo de códigos postales
      if (modalTab === "zip") {
        if (!formData.cps.trim()) {
          toast.error("Debe ingresar al menos un código postal");
          return;
        }

        const { validos, invalidos } = validarYNormalizarCPs(formData.cps);

        if (invalidos.length > 0) {
          setValidationErrors([
            `Códigos postales inválidos: ${invalidos.join(', ')}`,
            "Los códigos postales argentinos deben tener 4 dígitos y comenzar con un número del 1-9."
          ]);
          toast.error("Hay códigos postales inválidos");
          return;
        }

        if (validos.length === 0) {
          toast.error("No se encontraron códigos postales válidos");
          return;
        }
      }

      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 800));

      if (editingZona) {
        setZonas(zonas.map(z =>
          z.id === editingZona.id
            ? {
              ...z,
              ...formData,
              modo: modalTab as "polygon" | "zip",
              cobertura: modalTab === "polygon" ? "0 polígonos" : `${validarYNormalizarCPs(formData.cps).validos.length} CPs`,
              ultimaActualizacion: new Date().toISOString().split('T')[0]
            }
            : z
        ));
        toast.success("Zona actualizada correctamente");
      } else {
        const newZona: Zona = {
          id: String(Date.now()),
          nombre: formData.nombre,
          modo: modalTab as "polygon" | "zip",
          cobertura: modalTab === "polygon" ? "0 polígonos" : `${validarYNormalizarCPs(formData.cps).validos.length} CPs`,
          activo: formData.activo,
          ultimaActualizacion: new Date().toISOString().split('T')[0],
        };
        setZonas([...zonas, newZona]);
        toast.success("Zona creada correctamente");
      }

      setIsModalOpen(false);
      setValidationErrors([]);

    } catch (error) {
      toast.error("Error al guardar la zona. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async (zona: Zona) => {
    setIsLoading(true);
    try {
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 500));

      const duplicated: Zona = {
        ...zona,
        id: String(Date.now()),
        nombre: `${zona.nombre} (Copia)`,
        ultimaActualizacion: new Date().toISOString().split('T')[0],
      };
      setZonas([...zonas, duplicated]);
      toast.success("Zona duplicada correctamente");
    } catch (error) {
      toast.error("Error al duplicar la zona");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (zona: Zona) => {
    setIsLoading(true);
    try {
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 300));

      setZonas(zonas.map(z =>
        z.id === zona.id ? { ...z, activo: !z.activo } : z
      ));
      toast.success(zona.activo ? "Zona desactivada" : "Zona activada");
    } catch (error) {
      toast.error("Error al cambiar el estado de la zona");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteZona) return;

    setIsLoading(true);
    try {
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 600));

      setZonas(zonas.filter(z => z.id !== deleteZona.id));
      toast.success("Zona eliminada correctamente");
      setDeleteZona(null);
    } catch (error) {
      toast.error("Error al eliminar la zona");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para validar y normalizar CPs desde el botón
  const handleValidarNormalizarCPs = () => {
    if (!formData.cps.trim()) {
      toast.error("Ingrese códigos postales para validar");
      return;
    }

    const { validos, invalidos } = validarYNormalizarCPs(formData.cps);

    if (invalidos.length > 0) {
      setValidationErrors([
        `Códigos postales inválidos encontrados: ${invalidos.join(', ')}`,
        "Los códigos postales argentinos deben tener 4 dígitos y comenzar con un número del 1-9."
      ]);
      toast.error(`${invalidos.length} códigos postales inválidos encontrados`);
    } else {
      setValidationErrors([]);
      setFormData(prev => ({ ...prev, cps: validos.join(', ') }));
      toast.success(`${validos.length} códigos postales validados y normalizados`);
    }
  };

  const columns: ColumnDef<Zona>[] = [
    {
      accessorKey: "nombre",
      header: createSortableHeader("Nombre"),
    },
    {
      accessorKey: "modo",
      header: "Modo",
      cell: ({ row }) => (
        <span className="capitalize">
          {row.original.modo === "polygon" ? "Polígono" : "Códigos Postales"}
        </span>
      ),
    },
    {
      accessorKey: "cobertura",
      header: "Cobertura",
    },
    {
      accessorKey: "activo",
      header: "Estado",
      cell: ({ row }) => (
        <BadgeEstado
          estado={row.original.activo ? "success" : "neutral"}
          label={row.original.activo ? "Activo" : "Inactivo"}
        />
      ),
    },
    {
      accessorKey: "ultimaActualizacion",
      header: createSortableHeader("Últ. actualización"),
      cell: ({ row }) => new Date(row.original.ultimaActualizacion).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="backdrop-blur-xl bg-white/95">
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDuplicate(row.original)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleActive(row.original)}>
              <Power className="mr-2 h-4 w-4" />
              {row.original.activo ? "Desactivar" : "Activar"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteZona(row.original)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-xl flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700">Procesando...</span>
          </div>
        </div>
      )}

      <Toolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onNewClick={handleNew}
        newButtonLabel="Nueva zona"
        filters={[
          {
            label: "Estado",
            value: filterEstado,
            options: [
              { label: "Todos", value: "todos" },
              { label: "Activo", value: "activo" },
              { label: "Inactivo", value: "inactivo" },
            ],
            onChange: setFilterEstado,
          },
          {
            label: "Modo",
            value: filterModo,
            options: [
              { label: "Todos", value: "todos" },
              { label: "Polígono", value: "polygon" },
              { label: "CPs", value: "zip" },
            ],
            onChange: setFilterModo,
          },
        ]}
      />

      {filteredZonas.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No hay zonas de cobertura"
          description="Comienza creando tu primera zona de cobertura"
          actionLabel="Nueva zona"
          onAction={handleNew}
        />
      ) : (
        <DataTable columns={columns} data={filteredZonas} />
      )}

      {/* Modal Nueva/Editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingZona ? "Editar zona" : "Nueva zona de cobertura"}
            </DialogTitle>
            <DialogDescription>
              {editingZona ? "Modifica la información de la zona de cobertura" : "Completa los datos para crear una nueva zona de cobertura"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: CABA Centro"
                className="bg-white/80"
              />
            </div>

            <Tabs value={modalTab} onValueChange={setModalTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="polygon">Polígono</TabsTrigger>
                <TabsTrigger value="zip">Códigos Postales</TabsTrigger>
              </TabsList>

              <TabsContent value="polygon" className="space-y-4">
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center bg-purple-50/50">
                  <Map className="w-12 h-12 mx-auto text-purple-400 mb-3" />
                  <p className="text-gray-600 mb-4">Mapa interactivo (placeholder)</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm">Dibujar</Button>
                    <Button variant="outline" size="sm">Editar</Button>
                    <Button variant="outline" size="sm">Borrar</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="zip" className="space-y-4">
                <div>
                  <Label htmlFor="cps">Códigos Postales</Label>
                  <Textarea
                    id="cps"
                    value={formData.cps}
                    onChange={(e) => {
                      setFormData({ ...formData, cps: e.target.value });
                      setValidationErrors([]); // Limpiar errores al cambiar
                    }}
                    placeholder="Ingrese códigos postales separados por coma o enter&#10;Ej: 2000, 2001, 2002"
                    rows={6}
                    className="bg-white/80"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleValidarNormalizarCPs}
                    disabled={isLoading}
                  >
                    Validar y normalizar
                  </Button>

                  {/* Mostrar errores de validación */}
                  {validationErrors.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-white text-xs">!</span>
                        </div>
                        <div className="text-sm text-red-700">
                          {validationErrors.map((error, index) => (
                            <div key={index}>{error}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label htmlFor="activo">Zona activa</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  editingZona ? "Actualizar" : "Crear"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteZona}
        onOpenChange={(open) => !open && setDeleteZona(null)}
        title="Eliminar zona"
        description={`¿Estás seguro de que deseas eliminar la zona "${deleteZona?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}
