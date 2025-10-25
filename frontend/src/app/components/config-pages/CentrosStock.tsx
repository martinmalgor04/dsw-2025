import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Warehouse, MoreHorizontal, Edit } from "lucide-react";
import { DataTable, createSortableHeader } from "../config/DataTable";
import { Toolbar } from "../config/Toolbar";
import { EmptyState } from "../config/EmptyState";
import { BadgeEstado } from "../config/BadgeEstado";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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

type CentroEstado = "Activo" | "Inactivo" | "Pendiente";

interface CentroStock {
  id: string;
  nombre: string;
  direccion: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  horarioRecoleccion: string;
  contacto: string;
  estado: CentroEstado;
}

const mockCentros: CentroStock[] = [
  {
    id: "1",
    nombre: "CD Central Palermo",
    direccion: "Av. Juan B. Justo 2500",
    localidad: "C.A.B.A.",
    provincia: "Buenos Aires",
    codigoPostal: "1425",
    horarioRecoleccion: "Lun-Vie 08:00 a 20:00 hs",
    contacto: "Tel: (011) 4123-4567 | Email: palermo@ecommerce.com",
    estado: "Activo",
  },
  {
    id: "2",
    nombre: "Centro de Acopio Rosario Oeste",
    direccion: "Bv. 27 de Febrero 2000",
    localidad: "Rosario",
    provincia: "Santa Fe",
    codigoPostal: "2000",
    horarioRecoleccion: "Lun-Sab 09:00 a 19:00 hs",
    contacto: "Tel: (0341) 4876-5432 | Email: rosario@ecommerce.com",
    estado: "Activo",
  },
  {
    id: "3",
    nombre: "Almacén Regional Mendoza",
    direccion: "Av. Acceso Este 1050",
    localidad: "Guaymallén",
    provincia: "Mendoza",
    codigoPostal: "5500",
    horarioRecoleccion: "Lun-Vie 09:30 a 18:30 hs",
    contacto: "Tel: (0261) 4987-6543 | Email: mendoza@ecommerce.com",
    estado: "Activo",
  },
  {
    id: "4",
    nombre: "Depósito Principal Córdoba",
    direccion: "Av. Circunvalación N° 3200",
    localidad: "Córdoba",
    provincia: "Córdoba",
    codigoPostal: "X5000",
    horarioRecoleccion: "Lun-Vie 08:30 a 19:30 hs",
    contacto: "Tel: (0351) 410-1234 | Email: cordoba@ecommerce.com",
    estado: "Activo",
  },
  {
    id: "5",
    nombre: "Punto de Logística Neuquén",
    direccion: "Ruta Nacional 22 Km 1200",
    localidad: "Neuquén",
    provincia: "Neuquén",
    codigoPostal: "Q8300",
    horarioRecoleccion: "Lun-Vie 10:00 a 18:00 hs",
    contacto: "Tel: (0299) 478-9012 | Email: neuquen@ecommerce.com",
    estado: "Activo",
  },
];

const estadoBadgeMap: Record<CentroEstado, { variant: "success" | "error" | "warning" | "neutral"; label: string }> = {
  Activo: { variant: "success", label: "Activo" },
  Inactivo: { variant: "error", label: "Inactivo" },
  Pendiente: { variant: "warning", label: "Pendiente" },
};

const estadoOptions: { label: string; value: CentroEstado }[] = [
  { label: "Activo", value: "Activo" },
  { label: "Inactivo", value: "Inactivo" },
  { label: "Pendiente", value: "Pendiente" },
];

export function CentrosStock() {
  const [searchValue, setSearchValue] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<CentroEstado | "todos">("todos");
  const [centros, setCentros] = useState<CentroStock[]>(mockCentros);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCentro, setEditingCentro] = useState<CentroStock | null>(null);
  const [formData, setFormData] = useState<Omit<CentroStock, "id">>({
    nombre: "",
    direccion: "",
    localidad: "",
    provincia: "",
    codigoPostal: "",
    horarioRecoleccion: "",
    contacto: "",
    estado: "Activo",
  });

  const filteredCentros = useMemo(() => {
    return centros.filter((centro) => {
      const matchesSearch = [
        centro.nombre,
        centro.direccion,
        centro.localidad,
        centro.provincia,
        centro.codigoPostal,
        centro.horarioRecoleccion,
        centro.contacto,
        centro.estado,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchValue.toLowerCase());

      const matchesEstado =
        estadoFilter === "todos" ? true : centro.estado === estadoFilter;

      return matchesSearch && matchesEstado;
    });
  }, [centros, searchValue, estadoFilter]);

  const handleNew = () => {
    setEditingCentro(null);
    setFormData({
      nombre: "",
      direccion: "",
      localidad: "",
      provincia: "",
      codigoPostal: "",
      horarioRecoleccion: "",
      contacto: "",
      estado: "Activo",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (centro: CentroStock) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = centro;
    setEditingCentro(centro);
    setFormData(rest);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre del centro es requerido");
      return;
    }
    if (!formData.direccion.trim() || !formData.localidad.trim() || !formData.provincia.trim()) {
      toast.error("Completa dirección, localidad y provincia");
      return;
    }
    if (!formData.codigoPostal.trim()) {
      toast.error("El código postal es requerido");
      return;
    }

    if (editingCentro) {
      setCentros((prev) =>
        prev.map((centro) =>
          centro.id === editingCentro.id ? { ...centro, ...formData } : centro
        )
      );
      toast.success("Centro actualizado correctamente");
    } else {
      const nuevoCentro: CentroStock = {
        id: String(Date.now()),
        ...formData,
      };
      setCentros((prev) => [...prev, nuevoCentro]);
      toast.success("Centro creado correctamente");
    }
    setIsModalOpen(false);
  };

  const columns: ColumnDef<CentroStock>[] = [
    {
      accessorKey: "nombre",
      header: createSortableHeader("Centro de stock"),
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">{row.original.nombre}</div>
      ),
    },
    {
      accessorKey: "direccion",
      header: createSortableHeader("Dirección"),
      cell: ({ row }) => (
        <div className="text-gray-700">
          <div>{row.original.direccion}</div>
          <div className="text-sm text-gray-500">
            {row.original.localidad}, {row.original.provincia} ({row.original.codigoPostal})
          </div>
        </div>
      ),
    },
    {
      accessorKey: "horarioRecoleccion",
      header: "Horario de recolección",
      cell: ({ row }) => row.original.horarioRecoleccion,
    },
    {
      accessorKey: "contacto",
      header: "Contacto",
      cell: ({ row }) => (
        <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
          {row.original.contacto.replace(/\s*\|\s*/g, "\n")}
        </div>
      ),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const badge = estadoBadgeMap[row.original.estado] ?? estadoBadgeMap.Pendiente;
        return <BadgeEstado estado={badge.variant} label={badge.label} />;
      },
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
        newButtonLabel="Nuevo centro"
        filters={[
          {
            label: "Estado",
            value: estadoFilter,
            options: [
              { label: "Todos", value: "todos" },
              ...estadoOptions.map((option) => ({
                label: option.label,
                value: option.value,
              })),
            ],
            onChange: (value) => setEstadoFilter(value as CentroEstado | "todos"),
          },
        ]}
      />

      {centros.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="No hay centros de stock"
          description="Crea tu primer centro para centralizar y coordinar tus operaciones de stock."
          actionLabel="Nuevo centro"
          onAction={handleNew}
        />
      ) : (
        <DataTable columns={columns} data={filteredCentros} />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCentro ? "Editar centro de stock" : "Nuevo centro de stock"}</DialogTitle>
            <DialogDescription>
              Registra la información principal del punto de recolección con el que trabajas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: CD Central Palermo"
                  className="bg-white/80"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Ej: Av. Juan B. Justo 2500"
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="localidad">Localidad *</Label>
                <Input
                  id="localidad"
                  value={formData.localidad}
                  onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                  placeholder="Ej: C.A.B.A."
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="provincia">Provincia *</Label>
                <Input
                  id="provincia"
                  value={formData.provincia}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                  placeholder="Ej: Buenos Aires"
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="codigoPostal">Código postal *</Label>
                <Input
                  id="codigoPostal"
                  value={formData.codigoPostal}
                  onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                  placeholder="Ej: 1425"
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value as CentroEstado })}
                >
                  <SelectTrigger className="bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {estadoOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="horarioRecoleccion">Horario de recolección *</Label>
              <Input
                id="horarioRecoleccion"
                value={formData.horarioRecoleccion}
                onChange={(e) => setFormData({ ...formData, horarioRecoleccion: e.target.value })}
                placeholder="Ej: Lun-Vie 09:00 a 18:00 hs"
                className="bg-white/80"
              />
            </div>

            <div>
              <Label htmlFor="contacto">Contacto *</Label>
              <Input
                id="contacto"
                value={formData.contacto}
                onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                placeholder="Tel: (011) 4567-8900 | Email: contacto@centro.com"
                className="bg-white/80"
              />
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
    </div>
  );
}
