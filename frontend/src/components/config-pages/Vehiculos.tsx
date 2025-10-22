import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2, Truck, Bike, Car } from "lucide-react";
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

interface Vehiculo {
  id: string;
  patente: string;
  tipo: string;
  capacidadKg: number;
  capacidadM3: number;
  restricciones: string;
  activo: boolean;
}

const mockVehiculos: Vehiculo[] = [
  {
    id: "1",
    patente: "ABC123",
    tipo: "van",
    capacidadKg: 1000,
    capacidadM3: 10,
    restricciones: "",
    activo: true,
  },
  {
    id: "2",
    patente: "XYZ789",
    tipo: "truck",
    capacidadKg: 5000,
    capacidadM3: 40,
    restricciones: "No ADR",
    activo: true,
  },
  {
    id: "3",
    patente: "MOT456",
    tipo: "moto",
    capacidadKg: 50,
    capacidadM3: 0.5,
    restricciones: "",
    activo: false,
  },
];

const tiposVehiculo = [
  { value: "bike", label: "Bicicleta", icon: Bike },
  { value: "moto", label: "Moto", icon: Bike },
  { value: "van", label: "Camioneta", icon: Car },
  { value: "truck", label: "Camión", icon: Truck },
  { value: "refrigerated", label: "Refrigerado", icon: Truck },
];

export function Vehiculos() {
  const [searchValue, setSearchValue] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>(mockVehiculos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null);
  const [deleteVehiculo, setDeleteVehiculo] = useState<Vehiculo | null>(null);

  const [formData, setFormData] = useState({
    patente: "",
    tipo: "van",
    capacidadKg: 0,
    capacidadM3: 0,
    restricciones: "",
    activo: true,
  });

  const filteredVehiculos = vehiculos.filter((vehiculo) => {
    const matchesSearch = 
      vehiculo.patente.toLowerCase().includes(searchValue.toLowerCase()) ||
      vehiculo.restricciones.toLowerCase().includes(searchValue.toLowerCase());
    const matchesEstado = filterEstado === "todos" || 
      (filterEstado === "activo" && vehiculo.activo) ||
      (filterEstado === "inactivo" && !vehiculo.activo);
    const matchesTipo = filterTipo === "todos" || vehiculo.tipo === filterTipo;
    return matchesSearch && matchesEstado && matchesTipo;
  });

  const handleNew = () => {
    setEditingVehiculo(null);
    setFormData({
      patente: "",
      tipo: "van",
      capacidadKg: 0,
      capacidadM3: 0,
      restricciones: "",
      activo: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (vehiculo: Vehiculo) => {
    setEditingVehiculo(vehiculo);
    setFormData(vehiculo);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.patente.trim()) {
      toast.error("La patente es requerida");
      return;
    }

    if (formData.capacidadKg < 0 || formData.capacidadM3 < 0) {
      toast.error("Las capacidades deben ser mayores o iguales a 0");
      return;
    }

    // Verificar patente única
    const patenteExiste = vehiculos.some(
      v => v.patente.toUpperCase() === formData.patente.toUpperCase() && v.id !== editingVehiculo?.id
    );

    if (patenteExiste) {
      toast.error("Ya existe un vehículo con esta patente");
      return;
    }

    if (editingVehiculo) {
      setVehiculos(vehiculos.map(v => 
        v.id === editingVehiculo.id ? { ...v, ...formData } : v
      ));
      toast.success("Vehículo actualizado correctamente");
    } else {
      const newVehiculo: Vehiculo = {
        id: String(Date.now()),
        ...formData,
        patente: formData.patente.toUpperCase(),
      };
      setVehiculos([...vehiculos, newVehiculo]);
      toast.success("Vehículo creado correctamente");
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteVehiculo) {
      setVehiculos(vehiculos.filter(v => v.id !== deleteVehiculo.id));
      toast.success("Vehículo eliminado correctamente");
      setDeleteVehiculo(null);
    }
  };

  const getTipoLabel = (tipo: string) => {
    return tiposVehiculo.find(t => t.value === tipo)?.label || tipo;
  };

  const getTipoIcon = (tipo: string) => {
    const Icon = tiposVehiculo.find(t => t.value === tipo)?.icon || Truck;
    return <Icon className="w-4 h-4 inline mr-1" />;
  };

  const columns: ColumnDef<Vehiculo>[] = [
    {
      accessorKey: "patente",
      header: createSortableHeader("Patente"),
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => (
        <div className="flex items-center">
          {getTipoIcon(row.original.tipo)}
          {getTipoLabel(row.original.tipo)}
        </div>
      ),
    },
    {
      accessorKey: "capacidadKg",
      header: createSortableHeader("Capacidad (kg)"),
      cell: ({ row }) => `${row.original.capacidadKg.toLocaleString()} kg`,
    },
    {
      accessorKey: "capacidadM3",
      header: createSortableHeader("Capacidad (m³)"),
      cell: ({ row }) => `${row.original.capacidadM3} m³`,
    },
    {
      accessorKey: "restricciones",
      header: "Restricciones",
      cell: ({ row }) => row.original.restricciones || "-",
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
              onClick={() => setDeleteVehiculo(row.original)}
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
    <div>
      <Toolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onNewClick={handleNew}
        newButtonLabel="Nuevo vehículo"
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
            label: "Tipo",
            value: filterTipo,
            options: [
              { label: "Todos", value: "todos" },
              ...tiposVehiculo.map(t => ({ label: t.label, value: t.value })),
            ],
            onChange: setFilterTipo,
          },
        ]}
      />

      {filteredVehiculos.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No hay vehículos registrados"
          description="Comienza agregando tu primer vehículo"
          actionLabel="Nuevo vehículo"
          onAction={handleNew}
        />
      ) : (
        <DataTable columns={columns} data={filteredVehiculos} />
      )}

      {/* Modal Nueva/Editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingVehiculo ? "Editar vehículo" : "Nuevo vehículo"}
            </DialogTitle>
            <DialogDescription>
              {editingVehiculo ? "Modifica la información del vehículo" : "Completa los datos para registrar un nuevo vehículo"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="patente">Patente *</Label>
              <Input
                id="patente"
                value={formData.patente}
                onChange={(e) => setFormData({ ...formData, patente: e.target.value.toUpperCase() })}
                placeholder="Ej: ABC123"
                className="bg-white/80"
              />
            </div>

            <div>
              <Label htmlFor="tipo">Tipo de vehículo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger className="bg-white/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposVehiculo.map((tipo) => {
                    const Icon = tipo.icon;
                    return (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <div className="flex items-center">
                          <Icon className="w-4 h-4 mr-2" />
                          {tipo.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacidadKg">Capacidad (kg)</Label>
                <Input
                  id="capacidadKg"
                  type="number"
                  min="0"
                  value={formData.capacidadKg}
                  onChange={(e) => setFormData({ ...formData, capacidadKg: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="capacidadM3">Capacidad (m³)</Label>
                <Input
                  id="capacidadM3"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.capacidadM3}
                  onChange={(e) => setFormData({ ...formData, capacidadM3: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="restricciones">Restricciones</Label>
              <Input
                id="restricciones"
                value={formData.restricciones}
                onChange={(e) => setFormData({ ...formData, restricciones: e.target.value })}
                placeholder="Ej: No ADR, Sin frío"
                className="bg-white/80"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <Label htmlFor="activo">Vehículo activo</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white"
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteVehiculo}
        onOpenChange={(open) => !open && setDeleteVehiculo(null)}
        title="Eliminar vehículo"
        description={`¿Estás seguro de que deseas eliminar el vehículo "${deleteVehiculo?.patente}"?`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}
