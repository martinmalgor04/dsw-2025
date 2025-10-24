import React, { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2, Calculator, DollarSign, Package, Truck } from "lucide-react";
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
import type { TariffConfigDTO, CreateTariffConfigDTO, UpdateTariffConfigDTO } from "@/lib/middleware/services/tariff-config.service";

const environments = [
  { value: "development", label: "Desarrollo" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Producción" },
];

export function ReglasCotizacion() {
  const [searchValue, setSearchValue] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterEnvironment, setFilterEnvironment] = useState("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<TariffConfigDTO | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<TariffConfigDTO | null>(null);

  const {
    tariffConfigs,
    transportMethods,
    isLoading,
    error,
    createTariffConfig,
    updateTariffConfig,
    deleteTariffConfig,
    loadTariffConfigs
  } = useConfig();

  const [formData, setFormData] = useState<CreateTariffConfigDTO>({
    transportMethodId: "",
    baseTariff: 0,
    costPerKg: 0,
    costPerKm: 0,
    volumetricFactor: 167,
    environment: "development",
    isActive: true,
  });

  useEffect(() => {
    loadTariffConfigs();
  }, []); // Removido loadTariffConfigs de las dependencias

  const filteredConfigs = tariffConfigs.filter((config) => {
    const search = searchValue.toLowerCase();
    const matchesSearch =
      config.transportMethod?.name?.toLowerCase().includes(search) ||
      config.transportMethod?.code?.toLowerCase().includes(search) ||
      config.environment?.toLowerCase().includes(search);
    const matchesEstado =
      filterEstado === "todos" ||
      (filterEstado === "activo" && config.isActive) ||
      (filterEstado === "inactivo" && !config.isActive);
    const matchesEnvironment =
      filterEnvironment === "todos" ||
      config.environment === filterEnvironment;
    return matchesSearch && matchesEstado && matchesEnvironment;
  });

  const handleNew = () => {
    setEditingConfig(null);
    setFormData({
      transportMethodId: "",
      baseTariff: 0,
      costPerKg: 0,
      costPerKm: 0,
      volumetricFactor: 167,
      environment: "development",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (config: TariffConfigDTO) => {
    setEditingConfig(config);
    setFormData({
      transportMethodId: config.transportMethodId,
      baseTariff: config.baseTariff,
      costPerKg: config.costPerKg,
      costPerKm: config.costPerKm,
      volumetricFactor: config.volumetricFactor,
      environment: config.environment,
      isActive: config.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.transportMethodId.trim()) {
      toast.error("El método de transporte es requerido");
      return;
    }

    if (formData.baseTariff < 0 || formData.costPerKg < 0 || formData.costPerKm < 0) {
      toast.error("Los valores deben ser mayores o iguales a 0");
      return;
    }

    if (formData.volumetricFactor <= 0) {
      toast.error("El factor volumétrico debe ser mayor a 0");
      return;
    }

    try {
      if (editingConfig) {
        await updateTariffConfig(editingConfig.id, formData);
        toast.success("Configuración de tarifa actualizada correctamente");
      } else {
        await createTariffConfig(formData);
        toast.success("Configuración de tarifa creada correctamente");
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Error al guardar la configuración de tarifa");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfig) return;
    
    try {
      await deleteTariffConfig(deleteConfig.id);
      toast.success("Configuración de tarifa eliminada correctamente");
      setDeleteConfig(null);
    } catch (error) {
      toast.error("Error al eliminar la configuración de tarifa");
    }
  };

  const columns: ColumnDef<TariffConfigDTO>[] = [
    {
      id: "transportMethodIcon",
      header: "",
      cell: ({ row }) => {
        const method = row.original.transportMethod;
        return (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
        );
      },
    },
    {
      accessorKey: "transportMethod",
      accessorFn: (row) => row.transportMethod?.name || 'N/A',
      header: createSortableHeader("Método de Transporte"),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.transportMethod?.name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.original.transportMethod?.code || 'N/A'}</div>
        </div>
      ),
    },
    {
      accessorKey: "baseTariff",
      header: createSortableHeader("Tarifa Base"),
      cell: ({ row }) => `$${parseFloat(row.original.baseTariff.toString()).toFixed(2)}`,
    },
    {
      accessorKey: "costPerKg",
      header: createSortableHeader("Costo/kg"),
      cell: ({ row }) => `$${parseFloat(row.original.costPerKg.toString()).toFixed(2)}`,
    },
    {
      accessorKey: "costPerKm",
      header: createSortableHeader("Costo/km"),
      cell: ({ row }) => `$${parseFloat(row.original.costPerKm.toString()).toFixed(2)}`,
    },
    {
      accessorKey: "volumetricFactor",
      header: createSortableHeader("Factor Vol."),
      cell: ({ row }) => row.original.volumetricFactor,
    },
    {
      accessorKey: "environment",
      header: "Entorno",
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
          {row.original.environment || 'N/A'}
        </span>
      ),
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
              onClick={() => setDeleteConfig(row.original)}
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando configuraciones de tarifa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={() => loadTariffConfigs(true)}>
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
        newButtonLabel="Nueva regla"
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
          {
            label: "Entorno",
            value: filterEnvironment,
            options: [
              { label: "Todos", value: "todos" },
              ...environments,
            ],
            onChange: setFilterEnvironment,
          },
        ]}
      />

      {filteredConfigs.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="No hay reglas de cotización"
          description="Agrega una regla de cotización para comenzar a configurar tus tarifas de envío."
          actionLabel="Nueva regla"
          onAction={handleNew}
        />
      ) : (
        <DataTable columns={columns} data={filteredConfigs} searchValue={searchValue} />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? "Editar regla de cotización" : "Nueva regla de cotización"}
            </DialogTitle>
            <DialogDescription>
              Define los parámetros de la regla de cotización.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="transportMethodId">Método de Transporte *</Label>
              <Select
                value={formData.transportMethodId}
                onValueChange={(value) => setFormData({ ...formData, transportMethodId: value })}
              >
                <SelectTrigger className="bg-white/80">
                  <SelectValue placeholder="Selecciona un método de transporte" />
                </SelectTrigger>
                <SelectContent>
                  {transportMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name} ({method.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="baseTariff">Tarifa Base *</Label>
                <Input
                  id="baseTariff"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.baseTariff}
                  onChange={(e) => setFormData({ ...formData, baseTariff: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="volumetricFactor">Factor Volumétrico *</Label>
                <Input
                  id="volumetricFactor"
                  type="number"
                  min="1"
                  value={formData.volumetricFactor}
                  onChange={(e) => setFormData({ ...formData, volumetricFactor: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="costPerKg">Costo por kg *</Label>
                <Input
                  id="costPerKg"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPerKg}
                  onChange={(e) => setFormData({ ...formData, costPerKg: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="costPerKm">Costo por km *</Label>
                <Input
                  id="costPerKm"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPerKm}
                  onChange={(e) => setFormData({ ...formData, costPerKm: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="environment">Entorno</Label>
              <Select
                value={formData.environment}
                onValueChange={(value) => setFormData({ ...formData, environment: value })}
              >
                <SelectTrigger className="bg-white/80">
                  <SelectValue placeholder="Selecciona un entorno" />
                </SelectTrigger>
                <SelectContent>
                  {environments.map((env) => (
                    <SelectItem key={env.value} value={env.value}>
                      {env.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
              >
                Guardar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfig}
        onOpenChange={(open) => !open && setDeleteConfig(null)}
        title="Eliminar regla de cotización"
        description={`¿Estás seguro de que deseas eliminar la regla de cotización para "${deleteConfig?.transportMethod?.name || 'N/A'}"?`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}