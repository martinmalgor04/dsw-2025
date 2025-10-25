import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Package, Truck, Car, Plane, Train } from "lucide-react";
import { DataTable, createSortableHeader } from "../config/DataTable";
import { Toolbar } from "../config/Toolbar";
import { BadgeEstado } from "../config/BadgeEstado";
import { ConfirmDialog } from "../config/ConfirmDialog";
import { EmptyState } from "../config/EmptyState";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { useConfig } from "@/lib/middleware/stores/composables/useConfig";
import type { TransportMethod, CreateTransportMethodDTO } from "@/lib/middleware/services/config.service";

// Mapeo de códigos de transporte a iconos
const getTransportIcon = (code: string) => {
  const iconMap: Record<string, React.ElementType> = {
    'air': Plane,
    'sea': Package,
    'rail': Train,
    'road': Truck,
    'bike': Car,
  };
  return iconMap[code.toLowerCase()] || Truck;
};

const transportCodes = [
  { value: "air", label: "Aéreo" },
  { value: "sea", label: "Marítimo" },
  { value: "rail", label: "Ferroviario" },
  { value: "road", label: "Terrestre" },
];

export function TiposTransporte() {
  const [searchValue, setSearchValue] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TransportMethod | null>(null);
  const [deleteTipo, setDeleteTipo] = useState<TransportMethod | null>(null);

  const {
    transportMethods,
    isLoading,
    error,
    createTransportMethod,
    updateTransportMethod,
    deleteTransportMethod,
    loadTransportMethods
  } = useConfig();

  const [formData, setFormData] = useState<CreateTransportMethodDTO>({
    code: "",
    name: "",
    description: "",
    averageSpeed: 0,
    estimatedDays: "",
    baseCostPerKm: 0,
    baseCostPerKg: 0,
    isActive: true,
  });

  // loadTransportMethods ya se llama automáticamente en useConfig

  const filteredTipos = transportMethods.filter((tipo) => {
    const search = searchValue.toLowerCase();
    const matchesSearch =
      tipo.code.toLowerCase().includes(search) ||
      tipo.name.toLowerCase().includes(search) ||
      (tipo.description && tipo.description.toLowerCase().includes(search)) ||
      tipo.estimatedDays.toLowerCase().includes(search);
    const matchesEstado =
      filterEstado === "todos" ||
      (filterEstado === "activo" && tipo.isActive) ||
      (filterEstado === "inactivo" && !tipo.isActive);
    return matchesSearch && matchesEstado;
  });

  const handleNew = () => {
    setEditingTipo(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      averageSpeed: 0,
      estimatedDays: "",
      baseCostPerKm: 0,
      baseCostPerKg: 0,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (tipo: TransportMethod) => {
    setEditingTipo(tipo);
    setFormData({
      code: tipo.code,
      name: tipo.name,
      description: tipo.description || "",
      averageSpeed: tipo.averageSpeed,
      estimatedDays: tipo.estimatedDays,
      baseCostPerKm: tipo.baseCostPerKm,
      baseCostPerKg: tipo.baseCostPerKg,
      isActive: tipo.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error("El código y nombre son requeridos");
      return;
    }

    if (formData.averageSpeed < 0) {
      toast.error("La velocidad promedio debe ser mayor o igual a 0");
      return;
    }

    if (!formData.estimatedDays.trim()) {
      toast.error("Define los días estimados de entrega");
      return;
    }

    if (formData.baseCostPerKm < 0 || formData.baseCostPerKg < 0) {
      toast.error("Los costos deben ser mayores o iguales a 0");
      return;
    }

    try {
      if (editingTipo) {
        await updateTransportMethod(editingTipo.id, formData);
        toast.success("Método de transporte actualizado correctamente");
      } else {
        await createTransportMethod(formData);
        toast.success("Método de transporte creado correctamente");
      }
      setIsModalOpen(false);
    } catch {
      toast.error("Error al guardar el método de transporte");
    }
  };

  const handleDelete = async () => {
    if (!deleteTipo) return;
    
    try {
      await deleteTransportMethod(deleteTipo.id);
      toast.success("Método de transporte eliminado correctamente");
      setDeleteTipo(null);
    } catch {
      toast.error("Error al eliminar el método de transporte");
    }
  };

  const columns: ColumnDef<TransportMethod>[] = [
    {
      accessorKey: "icon",
      header: "",
      cell: ({ row }) => {
        const Icon = getTransportIcon(row.original.code);
        return (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-teal-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-purple-600" />
          </div>
        );
      },
    },
    {
      accessorKey: "code",
      header: createSortableHeader("Código"),
      cell: ({ row }) => (
        <code className="px-2 py-1 rounded bg-gray-100 text-sm">
          {row.original.code}
        </code>
      ),
    },
    {
      accessorKey: "name",
      header: createSortableHeader("Nombre"),
    },
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }) => row.original.description || "-",
    },
    {
      accessorKey: "averageSpeed",
      header: createSortableHeader("Velocidad (km/h)"),
      cell: ({ row }) => `${row.original.averageSpeed} km/h`,
    },
    {
      accessorKey: "estimatedDays",
      header: "Días estimados",
      cell: ({ row }) => row.original.estimatedDays,
    },
    {
      accessorKey: "baseCostPerKm",
      header: createSortableHeader("Costo/km"),
      cell: ({ row }) => `$${parseFloat(row.original.baseCostPerKm.toString()).toFixed(2)}`,
    },
    {
      accessorKey: "baseCostPerKg",
      header: createSortableHeader("Costo/kg"),
      cell: ({ row }) => `$${parseFloat(row.original.baseCostPerKg.toString()).toFixed(2)}`,
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => (
        <BadgeEstado
          estado={row.original.isActive ? "success" : "neutral"}
          label={row.original.isActive ? "Activo" : "Inactivo"}
        />
      ),
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
            <DropdownMenuItem
              onClick={() => setDeleteTipo(row.original)}
              className="text-red-600"
            >
              <Edit className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando métodos de transporte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={() => loadTransportMethods(true)}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onNewClick={handleNew}
        newButtonLabel="Nuevo método"
        filters={[
          {
            label: "Estado",
            value: filterEstado,
            options: [
              { label: "Todos", value: "todos" },
              { label: "Activos", value: "activo" },
              { label: "Inactivos", value: "inactivo" },
            ],
            onChange: setFilterEstado,
          },
        ]}
      />

      {filteredTipos.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No hay métodos de transporte"
          description="Agrega un método de transporte para comenzar a configurar tus opciones de envío."
          actionLabel="Nuevo método"
          onAction={handleNew}
        />
      ) : (
        <DataTable columns={columns} data={filteredTipos} searchValue={searchValue} />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTipo ? "Editar método de transporte" : "Nuevo método de transporte"}
            </DialogTitle>
            <DialogDescription>
              Define los parámetros del método de transporte.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Código *</Label>
                <Select
                  value={formData.code}
                  onValueChange={(value) => setFormData({ ...formData, code: value })}
                >
                  <SelectTrigger className="bg-white/80">
                    <SelectValue placeholder="Selecciona un código" />
                  </SelectTrigger>
                  <SelectContent>
                    {transportCodes.map((code) => (
                      <SelectItem key={code.value} value={code.value}>
                        {code.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Transporte Aéreo"
                  className="bg-white/80"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del método de transporte"
                className="bg-white/80"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="averageSpeed">Velocidad promedio (km/h) *</Label>
                <Input
                  id="averageSpeed"
                  type="number"
                  min="0"
                  value={formData.averageSpeed}
                  onChange={(e) => setFormData({ ...formData, averageSpeed: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="estimatedDays">Días estimados *</Label>
                <Input
                  id="estimatedDays"
                  value={formData.estimatedDays}
                  onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                  placeholder="Ej: 1-3"
                  className="bg-white/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="baseCostPerKm">Costo base por km *</Label>
                <Input
                  id="baseCostPerKm"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.baseCostPerKm}
                  onChange={(e) => setFormData({ ...formData, baseCostPerKm: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="baseCostPerKg">Costo base por kg *</Label>
                <Input
                  id="baseCostPerKg"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.baseCostPerKg}
                  onChange={(e) => setFormData({ ...formData, baseCostPerKg: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Activo</Label>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white"
              >
                Guardar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTipo}
        onOpenChange={(open) => !open && setDeleteTipo(null)}
        title="Eliminar método de transporte"
        description={`¿Estás seguro de que deseas eliminar el método "${deleteTipo?.name}"?`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}