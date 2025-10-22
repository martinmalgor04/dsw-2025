import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  Truck,
  Timer,
  ShieldCheck,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";

type EstadoConductor = "disponible" | "en_ruta" | "fuera_servicio";

interface Conductor {
  id: string;
  nombre: string;
  documento: string;
  telefono: string;
  email: string;
  licencia: string;
  habilitacion: string;
  tipoVehiculo: string;
  turno: string;
  base: string;
  estado: EstadoConductor;
  activo: boolean;
}

const conductoresMock: Conductor[] = [
  {
    id: "1",
    nombre: "Maria Gonzalez",
    documento: "DNI 32.456.789",
    telefono: "(11) 4500-1122",
    email: "maria.gonzalez@pepack.com",
    licencia: "B1 - Vence 12/2025",
    habilitacion: "LINTI - Carga general",
    tipoVehiculo: "Moto",
    turno: "Manana",
    base: "CD Central Palermo",
    estado: "disponible",
    activo: true,
  },
  {
    id: "2",
    nombre: "Carlos Perdomo",
    documento: "DNI 28.903.114",
    telefono: "(11) 4700-2233",
    email: "carlos.perdomo@pepack.com",
    licencia: "C1 - Vence 06/2026",
    habilitacion: "LINTI - Carga refrigerada",
    tipoVehiculo: "Camion refrigerado",
    turno: "Noche",
    base: "Deposito Principal Cordoba",
    estado: "en_ruta",
    activo: true,
  },
  {
    id: "3",
    nombre: "Luciana Barrios",
    documento: "DNI 34.221.900",
    telefono: "(341) 423-9087",
    email: "luciana.barrios@pepack.com",
    licencia: "B1 - Vence 08/2025",
    habilitacion: "LINTI - Carga general",
    tipoVehiculo: "Van",
    turno: "Tarde",
    base: "Centro de Acopio Rosario Oeste",
    estado: "disponible",
    activo: true,
  },
  {
    id: "4",
    nombre: "Federico Diaz",
    documento: "DNI 30.115.600",
    telefono: "(261) 422-1110",
    email: "federico.diaz@pepack.com",
    licencia: "C1 - Vence 04/2026",
    habilitacion: "LINTI - Carga general",
    tipoVehiculo: "Camion",
    turno: "Manana",
    base: "Almacen Regional Mendoza",
    estado: "fuera_servicio",
    activo: false,
  },
  {
    id: "5",
    nombre: "Sofia Herrera",
    documento: "DNI 33.501.004",
    telefono: "(299) 443-7788",
    email: "sofia.herrera@pepack.com",
    licencia: "A2 - Vence 02/2026",
    habilitacion: "LINTI - Carga general",
    tipoVehiculo: "Moto",
    turno: "Manana",
    base: "Punto de Logistica Neuquen",
    estado: "en_ruta",
    activo: true,
  },
];

const estadoBadges: Record<EstadoConductor, { variant: "success" | "warning" | "neutral"; label: string }> = {
  disponible: { variant: "success", label: "Disponible" },
  en_ruta: { variant: "warning", label: "En ruta" },
  fuera_servicio: { variant: "neutral", label: "Fuera de servicio" },
};

const turnos = ["Manana", "Tarde", "Noche"];
const bases = [
  "CD Central Palermo",
  "Centro de Acopio Rosario Oeste",
  "Almacen Regional Mendoza",
  "Deposito Principal Cordoba",
  "Punto de Logistica Neuquen",
];

export function Conductores() {
  const [searchValue, setSearchValue] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoConductor | "todos">("todos");
  const [conductores, setConductores] = useState<Conductor[]>(conductoresMock);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConductor, setEditingConductor] = useState<Conductor | null>(null);
  const [deleteConductor, setDeleteConductor] = useState<Conductor | null>(null);

  const [formData, setFormData] = useState<Omit<Conductor, "id">>({
    nombre: "",
    documento: "",
    telefono: "",
    email: "",
    licencia: "",
    habilitacion: "",
    tipoVehiculo: "Moto",
    turno: turnos[0],
    base: bases[0],
    estado: "disponible",
    activo: true,
  });

  const filteredConductores = useMemo(() => {
    const search = searchValue.toLowerCase();
    return conductores.filter((conductor) => {
      const matchesSearch =
        conductor.nombre.toLowerCase().includes(search) ||
        conductor.documento.toLowerCase().includes(search) ||
        conductor.telefono.toLowerCase().includes(search) ||
        conductor.email.toLowerCase().includes(search) ||
        conductor.base.toLowerCase().includes(search) ||
        conductor.tipoVehiculo.toLowerCase().includes(search);

      const matchesEstado =
        estadoFilter === "todos" ? true : conductor.estado === estadoFilter;

      return matchesSearch && matchesEstado;
    });
  }, [conductores, searchValue, estadoFilter]);

  const handleNew = () => {
    setEditingConductor(null);
    setFormData({
      nombre: "",
      documento: "",
      telefono: "",
      email: "",
      licencia: "",
      habilitacion: "",
      tipoVehiculo: "Moto",
      turno: turnos[0],
      base: bases[0],
      estado: "disponible",
      activo: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (conductor: Conductor) => {
    const { id, ...rest } = conductor;
    setEditingConductor(conductor);
    setFormData(rest);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    if (!formData.documento.trim()) {
      toast.error("El documento es obligatorio");
      return;
    }

    if (!formData.telefono.trim()) {
      toast.error("El telefono es obligatorio");
      return;
    }

    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("El email no es valido");
      return;
    }

    if (editingConductor) {
      setConductores((prev) =>
        prev.map((conductor) =>
          conductor.id === editingConductor.id ? { ...conductor, ...formData } : conductor
        )
      );
      toast.success("Conductor actualizado correctamente");
    } else {
      const nuevo: Conductor = {
        id: String(Date.now()),
        ...formData,
      };
      setConductores((prev) => [...prev, nuevo]);
      toast.success("Conductor registrado correctamente");
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConductor) return;
    setConductores((prev) => prev.filter((c) => c.id !== deleteConductor.id));
    toast.success("Conductor eliminado correctamente");
    setDeleteConductor(null);
  };

  const columns: ColumnDef<Conductor>[] = [
    {
      accessorKey: "nombre",
      header: createSortableHeader("Nombre"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-teal-100 flex items-center justify-center">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.original.nombre}</div>
            <div className="text-sm text-gray-500">{row.original.documento}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "contacto",
      header: "Contacto",
      cell: ({ row }) => (
        <div className="space-y-1 text-sm text-gray-700">
          <div className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-gray-500" />
            <span>{row.original.telefono}</span>
          </div>
          <div className="flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-gray-500" />
            <span>{row.original.email}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "licencia",
      header: "Licencia",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.licencia}</div>
          <div className="text-gray-500">{row.original.habilitacion}</div>
        </div>
      ),
    },
    {
      accessorKey: "tipoVehiculo",
      header: "Tipo de vehiculo",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-purple-500" />
          <span>{row.original.tipoVehiculo}</span>
        </div>
      ),
    },
    {
      accessorKey: "turno",
      header: createSortableHeader("Turno"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm">
          <Timer className="w-3.5 h-3.5 text-gray-500" />
          <span>{row.original.turno}</span>
        </div>
      ),
    },
    {
      accessorKey: "base",
      header: "Base logistica",
      cell: ({ row }) => row.original.base,
    },
    {
      accessorKey: "estado",
      header: "Estado operativo",
      cell: ({ row }) => {
        const badge = estadoBadges[row.original.estado];
        return <BadgeEstado estado={badge.variant} label={badge.label} />;
      },
    },
    {
      accessorKey: "activo",
      header: "Habilitado",
      cell: ({ row }) =>
        row.original.activo ? (
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        ) : (
          "-"
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
              onClick={() => setDeleteConductor(row.original)}
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
    <div className="space-y-6">
      <Toolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onNewClick={handleNew}
        newButtonLabel="Nuevo conductor"
        filters={[
          {
            label: "Estado",
            value: estadoFilter,
            options: [
              { label: "Todos", value: "todos" },
              { label: "Disponibles", value: "disponible" },
              { label: "En ruta", value: "en_ruta" },
              { label: "Fuera de servicio", value: "fuera_servicio" },
            ],
            onChange: (value) => setEstadoFilter(value as EstadoConductor | "todos"),
          },
        ]}
      />

      {conductores.length === 0 ? (
        <EmptyState
          icon={User}
          title="No hay conductores cargados"
          description="Agrega tus conductores para asignar rutas y monitorear su disponibilidad."
          actionLabel="Nuevo conductor"
          onAction={handleNew}
        />
      ) : (
        <DataTable columns={columns} data={filteredConductores} />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingConductor ? "Editar conductor" : "Nuevo conductor"}</DialogTitle>
            <DialogDescription>
              Completa los datos principales del conductor para poder asignarle rutas y vehiculos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre completo *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Juan Perez"
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="documento">Documento *</Label>
                <Input
                  id="documento"
                  value={formData.documento}
                  onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                  placeholder="Ej: DNI 30.123.456"
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Telefono *</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Ej: (011) 4567-8900"
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@pepack.com"
                  className="bg-white/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licencia">Licencia *</Label>
                <Input
                  id="licencia"
                  value={formData.licencia}
                  onChange={(e) => setFormData({ ...formData, licencia: e.target.value })}
                  placeholder="Ej: C1 - Vence 12/2025"
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="habilitacion">Habilitacion</Label>
                <Input
                  id="habilitacion"
                  value={formData.habilitacion}
                  onChange={(e) => setFormData({ ...formData, habilitacion: e.target.value })}
                  placeholder="Ej: LINTI - Carga general"
                  className="bg-white/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tipoVehiculo">Tipo de vehiculo habitual</Label>
                <Input
                  id="tipoVehiculo"
                  value={formData.tipoVehiculo}
                  onChange={(e) => setFormData({ ...formData, tipoVehiculo: e.target.value })}
                  placeholder="Ej: Moto, Van, Camion"
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="turno">Turno</Label>
                <Select
                  value={formData.turno}
                  onValueChange={(value) => setFormData({ ...formData, turno: value })}
                >
                  <SelectTrigger id="turno" className="bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {turnos.map((turno) => (
                      <SelectItem key={turno} value={turno}>
                        {turno}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="base">Base logistica</Label>
                <Select
                  value={formData.base}
                  onValueChange={(value) => setFormData({ ...formData, base: value })}
                >
                  <SelectTrigger id="base" className="bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bases.map((base) => (
                      <SelectItem key={base} value={base}>
                        {base}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estado">Estado operativo</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value as EstadoConductor })}
                >
                  <SelectTrigger id="estado" className="bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="en_ruta">En ruta</SelectItem>
                    <SelectItem value="fuera_servicio">Fuera de servicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6 md:pt-0">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label htmlFor="activo">Conductor habilitado</Label>
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

      <ConfirmDialog
        open={!!deleteConductor}
        onOpenChange={(open) => !open && setDeleteConductor(null)}
        title="Eliminar conductor"
        description={`Estas seguro de que deseas eliminar a "${deleteConductor?.nombre}"?`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}




