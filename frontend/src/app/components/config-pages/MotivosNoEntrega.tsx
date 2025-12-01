import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2, XOctagon } from "lucide-react";
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
import { Textarea } from "../ui/textarea";
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

interface MotivoNoEntrega {
  id: string;
  codigo: string;
  motivo: string;
  categoria: string;
  accionSugerida: string;
  activo: boolean;
  orden: number;
}

const mockMotivos: MotivoNoEntrega[] = [
  {
    id: "1",
    codigo: "CLIENTE_AUSENTE",
    motivo: "Cliente ausente",
    categoria: "cliente",
    accionSugerida: "Reagendar entrega",
    activo: true,
    orden: 1,
  },
  {
    id: "2",
    codigo: "DIRECCION_INCORRECTA",
    motivo: "Dirección incorrecta",
    categoria: "cliente",
    accionSugerida: "Contactar para corregir dirección",
    activo: true,
    orden: 2,
  },
  {
    id: "3",
    codigo: "PAQUETE_DAÑADO",
    motivo: "Paquete dañado",
    categoria: "operativa",
    accionSugerida: "Devolver a origen",
    activo: true,
    orden: 3,
  },
  {
    id: "4",
    codigo: "ZONA_INSEGURA",
    motivo: "Zona insegura",
    categoria: "transito",
    accionSugerida: "Coordinar nueva entrega con seguridad",
    activo: true,
    orden: 4,
  },
  {
    id: "5",
    codigo: "RECHAZO_CLIENTE",
    motivo: "Cliente rechaza paquete",
    categoria: "cliente",
    accionSugerida: "Devolver a remitente",
    activo: true,
    orden: 5,
  },
  {
    id: "6",
    codigo: "CLIMA_ADVERSO",
    motivo: "Clima adverso",
    categoria: "transito",
    accionSugerida: "Reprogramar para siguiente día hábil",
    activo: true,
    orden: 6,
  },
];

const categorias = [
  { value: "cliente", label: "Cliente" },
  { value: "operativa", label: "Operativa" },
  { value: "transito", label: "Tránsito" },
];

export function MotivosNoEntrega() {
  const [searchValue, setSearchValue] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterCategoria, setFilterCategoria] = useState("todos");
  const [motivos, setMotivos] = useState<MotivoNoEntrega[]>(mockMotivos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMotivo, setEditingMotivo] = useState<MotivoNoEntrega | null>(null);
  const [deleteMotivo, setDeleteMotivo] = useState<MotivoNoEntrega | null>(null);

  const [formData, setFormData] = useState({
    codigo: "",
    motivo: "",
    categoria: "cliente",
    accionSugerida: "",
    activo: true,
    orden: 1,
  });

  const filteredMotivos = motivos.filter((motivo) => {
    const matchesSearch = 
      motivo.codigo.toLowerCase().includes(searchValue.toLowerCase()) ||
      motivo.motivo.toLowerCase().includes(searchValue.toLowerCase());
    const matchesEstado = filterEstado === "todos" || 
      (filterEstado === "activo" && motivo.activo) ||
      (filterEstado === "inactivo" && !motivo.activo);
    const matchesCategoria = filterCategoria === "todos" || motivo.categoria === filterCategoria;
    return matchesSearch && matchesEstado && matchesCategoria;
  });

  const handleNew = () => {
    setEditingMotivo(null);
    setFormData({
      codigo: "",
      motivo: "",
      categoria: "cliente",
      accionSugerida: "",
      activo: true,
      orden: motivos.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (motivo: MotivoNoEntrega) => {
    setEditingMotivo(motivo);
    setFormData(motivo);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.codigo.trim() || !formData.motivo.trim()) {
      toast.error("El código y motivo son requeridos");
      return;
    }

    if (formData.accionSugerida.length > 120) {
      toast.error("La acción sugerida no puede superar 120 caracteres");
      return;
    }

    const codigoExiste = motivos.some(
      m => m.codigo.toUpperCase() === formData.codigo.toUpperCase() && m.id !== editingMotivo?.id
    );

    if (codigoExiste) {
      toast.error("Ya existe un motivo con este código");
      return;
    }

    if (editingMotivo) {
      setMotivos(motivos.map(m => 
        m.id === editingMotivo.id ? { ...m, ...formData } : m
      ));
      toast.success("Motivo actualizado correctamente");
    } else {
      const newMotivo: MotivoNoEntrega = {
        id: String(Date.now()),
        ...formData,
        codigo: formData.codigo.toUpperCase(),
      };
      setMotivos([...motivos, newMotivo]);
      toast.success("Motivo creado correctamente");
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteMotivo) {
      setMotivos(motivos.filter(m => m.id !== deleteMotivo.id));
      toast.success("Motivo eliminado correctamente");
      setDeleteMotivo(null);
    }
  };

  const getCategoriaColor = (categoria: string) => {
    const colors = {
      cliente: "text-blue-700 bg-blue-100 border-blue-300",
      operativa: "text-orange-700 bg-orange-100 border-orange-300",
      transito: "text-purple-700 bg-purple-100 border-purple-300",
    };
    return colors[categoria as keyof typeof colors] || colors.cliente;
  };

  const columns: ColumnDef<MotivoNoEntrega>[] = [
    {
      accessorKey: "orden",
      header: "#",
      cell: ({ row }) => row.original.orden,
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
      accessorKey: "motivo",
      header: createSortableHeader("Motivo"),
    },
    {
      accessorKey: "categoria",
      header: "Categoría",
      cell: ({ row }) => (
        <span className={`px-3 py-1 rounded-full border capitalize ${getCategoriaColor(row.original.categoria)}`}>
          {row.original.categoria}
        </span>
      ),
    },
    {
      accessorKey: "accionSugerida",
      header: "Acción sugerida",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.accionSugerida}</span>
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
              onClick={() => setDeleteMotivo(row.original)}
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
        newButtonLabel="Nuevo motivo"
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
            label: "Categoría",
            value: filterCategoria,
            options: [
              { label: "Todas", value: "todos" },
              ...categorias.map(c => ({ label: c.label, value: c.value })),
            ],
            onChange: setFilterCategoria,
          },
        ]}
      />

      {filteredMotivos.length === 0 ? (
        <EmptyState
          icon={XOctagon}
          title="No hay motivos de no entrega"
          description="Configura los motivos por los cuales no se pudo realizar una entrega"
          actionLabel="Nuevo motivo"
          onAction={handleNew}
        />
      ) : (
        <DataTable columns={columns} data={filteredMotivos} />
      )}

      {/* Modal Nueva/Editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingMotivo ? "Editar motivo" : "Nuevo motivo de no entrega"}
            </DialogTitle>
            <DialogDescription>
              {editingMotivo ? "Modifica la información del motivo de no entrega" : "Define un nuevo motivo para clasificar las no entregas"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().replace(/[^A-Z_]/g, '') })}
                placeholder="Ej: CLIENTE_AUSENTE"
                className="bg-white/80 font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">Solo mayúsculas y guiones bajos</p>
            </div>

            <div>
              <Label htmlFor="motivo">Motivo *</Label>
              <Input
                id="motivo"
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                placeholder="Ej: Cliente ausente"
                className="bg-white/80"
              />
            </div>

            <div>
              <Label htmlFor="categoria">Categoría *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger className="bg-white/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="accionSugerida">Acción sugerida</Label>
              <Textarea
                id="accionSugerida"
                value={formData.accionSugerida}
                onChange={(e) => setFormData({ ...formData, accionSugerida: e.target.value })}
                placeholder="Ej: Reagendar entrega para el siguiente día"
                maxLength={120}
                rows={3}
                className="bg-white/80"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.accionSugerida.length}/120 caracteres
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orden">Orden</Label>
                <Input
                  id="orden"
                  type="number"
                  min="1"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                  <Label htmlFor="activo">Activo</Label>
                </div>
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
        open={!!deleteMotivo}
        onOpenChange={(open) => !open && setDeleteMotivo(null)}
        title="Eliminar motivo"
        description={`¿Estás seguro de que deseas eliminar el motivo "${deleteMotivo?.motivo}"?`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}
