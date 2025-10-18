import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2, Package, Bike, Truck, Car, Snowflake } from "lucide-react";
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
import { Checkbox } from "../ui/checkbox";
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

interface TipoTransporte {
  id: string;
  codigo: string;
  nombre: string;
  capacidadKg: number;
  capacidadM3: number;
  slaSoportado: string[];
  requiereFrio: boolean;
  activo: boolean;
  icono: string;
}

const mockTipos: TipoTransporte[] = [
  {
    id: "1",
    codigo: "bike",
    nombre: "Bicicleta",
    capacidadKg: 20,
    capacidadM3: 0.3,
    slaSoportado: ["same-day"],
    requiereFrio: false,
    activo: true,
    icono: "bike",
  },
  {
    id: "2",
    codigo: "moto",
    nombre: "Motocicleta",
    capacidadKg: 50,
    capacidadM3: 0.5,
    slaSoportado: ["same-day", "next-day"],
    requiereFrio: false,
    activo: true,
    icono: "bike",
  },
  {
    id: "3",
    codigo: "van",
    nombre: "Camioneta",
    capacidadKg: 1000,
    capacidadM3: 10,
    slaSoportado: ["same-day", "next-day"],
    requiereFrio: false,
    activo: true,
    icono: "car",
  },
  {
    id: "4",
    codigo: "truck",
    nombre: "Camión",
    capacidadKg: 5000,
    capacidadM3: 40,
    slaSoportado: ["next-day", "standard"],
    requiereFrio: false,
    activo: true,
    icono: "truck",
  },
  {
    id: "5",
    codigo: "refrigerated",
    nombre: "Refrigerado",
    capacidadKg: 3000,
    capacidadM3: 25,
    slaSoportado: ["next-day", "standard"],
    requiereFrio: true,
    activo: true,
    icono: "truck",
  },
];

const iconosDisponibles = [
  { value: "bike", label: "Bicicleta", icon: Bike },
  { value: "car", label: "Auto", icon: Car },
  { value: "truck", label: "Camión", icon: Truck },
  { value: "package", label: "Paquete", icon: Package },
];

const slaOpciones = [
  { value: "same-day", label: "Same-day" },
  { value: "next-day", label: "Next-day" },
  { value: "standard", label: "Standard" },
];

export function TiposTransporte() {
  const [searchValue, setSearchValue] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [tipos, setTipos] = useState<TipoTransporte[]>(mockTipos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoTransporte | null>(null);
  const [deleteTipo, setDeleteTipo] = useState<TipoTransporte | null>(null);

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    capacidadKg: 0,
    capacidadM3: 0,
    slaSoportado: [] as string[],
    requiereFrio: false,
    activo: true,
    icono: "truck",
  });

  const filteredTipos = tipos.filter((tipo) => {
    const matchesSearch = 
      tipo.codigo.toLowerCase().includes(searchValue.toLowerCase()) ||
      tipo.nombre.toLowerCase().includes(searchValue.toLowerCase());
    const matchesEstado = filterEstado === "todos" || 
      (filterEstado === "activo" && tipo.activo) ||
      (filterEstado === "inactivo" && !tipo.activo);
    return matchesSearch && matchesEstado;
  });

  const handleNew = () => {
    setEditingTipo(null);
    setFormData({
      codigo: "",
      nombre: "",
      capacidadKg: 0,
      capacidadM3: 0,
      slaSoportado: [],
      requiereFrio: false,
      activo: true,
      icono: "truck",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (tipo: TipoTransporte) => {
    setEditingTipo(tipo);
    setFormData(tipo);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      toast.error("El código y nombre son requeridos");
      return;
    }

    if (formData.capacidadKg < 0 || formData.capacidadM3 < 0) {
      toast.error("Las capacidades deben ser mayores o iguales a 0");
      return;
    }

    const codigoExiste = tipos.some(
      t => t.codigo.toLowerCase() === formData.codigo.toLowerCase() && t.id !== editingTipo?.id
    );

    if (codigoExiste) {
      toast.error("Ya existe un tipo de transporte con este código");
      return;
    }

    if (editingTipo) {
      setTipos(tipos.map(t => 
        t.id === editingTipo.id ? { ...t, ...formData } : t
      ));
      toast.success("Tipo de transporte actualizado correctamente");
    } else {
      const newTipo: TipoTransporte = {
        id: String(Date.now()),
        ...formData,
        codigo: formData.codigo.toLowerCase(),
      };
      setTipos([...tipos, newTipo]);
      toast.success("Tipo de transporte creado correctamente");
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteTipo) {
      setTipos(tipos.filter(t => t.id !== deleteTipo.id));
      toast.success("Tipo de transporte eliminado correctamente");
      setDeleteTipo(null);
    }
  };

  const toggleSLA = (sla: string) => {
    setFormData(prev => ({
      ...prev,
      slaSoportado: prev.slaSoportado.includes(sla)
        ? prev.slaSoportado.filter(s => s !== sla)
        : [...prev.slaSoportado, sla]
    }));
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      bike: Bike,
      car: Car,
      truck: Truck,
      package: Package,
    };
    return iconMap[iconName] || Truck;
  };

  const columns: ColumnDef<TipoTransporte>[] = [
    {
      accessorKey: "icono",
      header: "",
      cell: ({ row }) => {
        const Icon = getIconComponent(row.original.icono);
        return (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-teal-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-purple-600" />
          </div>
        );
      },
    },
    {
      accessorKey: "codigo",
      header: createSortableHeader("Código"),
      cell: ({ row }) => (
        <code className="px-2 py-1 rounded bg-gray-100 text-sm">
          {row.original.codigo}
        </code>
      ),
    },
    {
      accessorKey: "nombre",
      header: createSortableHeader("Nombre"),
    },
    {
      accessorKey: "capacidadKg",
      header: createSortableHeader("Cap. típica (kg)"),
      cell: ({ row }) => `${row.original.capacidadKg.toLocaleString()} kg`,
    },
    {
      accessorKey: "capacidadM3",
      header: "Cap. típica (m³)",
      cell: ({ row }) => `${row.original.capacidadM3} m³`,
    },
    {
      accessorKey: "slaSoportado",
      header: "SLA soportado",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.slaSoportado.map((sla) => (
            <span
              key={sla}
              className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs"
            >
              {sla}
            </span>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "requiereFrio",
      header: "Frío",
      cell: ({ row }) => 
        row.original.requiereFrio ? (
          <Snowflake className="w-4 h-4 text-blue-500" />
        ) : (
          "-"
        ),
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
              onClick={() => setDeleteTipo(row.original)}
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
        newButtonLabel="Nuevo tipo"
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
        ]}
      />

      {filteredTipos.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No hay tipos de transporte"
          description="Configura los tipos de transporte disponibles"
          actionLabel="Nuevo tipo"
          onAction={handleNew}
        />
      ) : (
        <DataTable columns={columns} data={filteredTipos} />
      )}

      {/* Modal Nueva/Editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingTipo ? "Editar tipo de transporte" : "Nuevo tipo de transporte"}
            </DialogTitle>
            <DialogDescription>
              {editingTipo ? "Modifica la información del tipo de transporte" : "Define las características de un nuevo tipo de transporte"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toLowerCase() })}
                placeholder="Ej: bike, van, truck"
                className="bg-white/80"
              />
            </div>

            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Camioneta"
                className="bg-white/80"
              />
            </div>

            <div>
              <Label htmlFor="icono">Icono</Label>
              <Select
                value={formData.icono}
                onValueChange={(value) => setFormData({ ...formData, icono: value })}
              >
                <SelectTrigger className="bg-white/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconosDisponibles.map((icono) => {
                    const Icon = icono.icon;
                    return (
                      <SelectItem key={icono.value} value={icono.value}>
                        <div className="flex items-center">
                          <Icon className="w-4 h-4 mr-2" />
                          {icono.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacidadKg">Capacidad típica (kg)</Label>
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
                <Label htmlFor="capacidadM3">Capacidad típica (m³)</Label>
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
              <Label className="mb-3 block">SLA soportado *</Label>
              <div className="space-y-2">
                {slaOpciones.map((sla) => (
                  <div key={sla.value} className="flex items-center gap-2">
                    <Checkbox
                      id={sla.value}
                      checked={formData.slaSoportado.includes(sla.value)}
                      onCheckedChange={() => toggleSLA(sla.value)}
                    />
                    <Label htmlFor={sla.value} className="cursor-pointer">
                      {sla.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="requiereFrio"
                  checked={formData.requiereFrio}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiereFrio: checked })}
                />
                <Label htmlFor="requiereFrio" className="flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-blue-500" />
                  Requiere refrigeración
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label htmlFor="activo">Activo</Label>
              </div>
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
        open={!!deleteTipo}
        onOpenChange={(open) => !open && setDeleteTipo(null)}
        title="Eliminar tipo de transporte"
        description={`¿Estás seguro de que deseas eliminar el tipo "${deleteTipo?.nombre}"?`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}
