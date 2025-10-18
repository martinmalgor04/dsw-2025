import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2, Clock, Calendar, Copy } from "lucide-react";
import { DataTable, createSortableHeader } from "../config/DataTable";
import { Toolbar } from "../config/Toolbar";
import { ConfirmDialog } from "../config/ConfirmDialog";
import { EmptyState } from "../config/EmptyState";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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

interface VentanaOperativa {
  id: string;
  deposito: string;
  dias: string;
  horaInicio: string;
  horaFin: string;
  cortePreparacion: string;
  timezone: string;
  excepciones: string;
}

const mockVentanas: VentanaOperativa[] = [
  {
    id: "1",
    deposito: "CD CABA",
    dias: "Lun-Vie",
    horaInicio: "08:00",
    horaFin: "18:00",
    cortePreparacion: "16:00",
    timezone: "America/Argentina/Buenos_Aires",
    excepciones: "2 feriados",
  },
  {
    id: "2",
    deposito: "CD Rosario",
    dias: "Lun-Sáb",
    horaInicio: "07:00",
    horaFin: "20:00",
    cortePreparacion: "17:00",
    timezone: "America/Argentina/Buenos_Aires",
    excepciones: "1 blackout",
  },
];

const timezones = [
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
  { value: "America/Argentina/Cordoba", label: "Córdoba (GMT-3)" },
  { value: "America/Argentina/Mendoza", label: "Mendoza (GMT-3)" },
];

const diasSemana = [
  { id: "lun", label: "Lun" },
  { id: "mar", label: "Mar" },
  { id: "mie", label: "Mié" },
  { id: "jue", label: "Jue" },
  { id: "vie", label: "Vie" },
  { id: "sab", label: "Sáb" },
  { id: "dom", label: "Dom" },
];

export function VentanasOperativas() {
  const [searchValue, setSearchValue] = useState("");
  const [ventanas, setVentanas] = useState<VentanaOperativa[]>(mockVentanas);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVentana, setEditingVentana] = useState<VentanaOperativa | null>(null);
  const [deleteVentana, setDeleteVentana] = useState<VentanaOperativa | null>(null);

  const [formData, setFormData] = useState({
    deposito: "",
    diasActivos: ["lun", "mar", "mie", "jue", "vie"],
    horaInicio: "08:00",
    horaFin: "18:00",
    cortePreparacion: "16:00",
    timezone: "America/Argentina/Buenos_Aires",
  });

  const handleNew = () => {
    setEditingVentana(null);
    setFormData({
      deposito: "",
      diasActivos: ["lun", "mar", "mie", "jue", "vie"],
      horaInicio: "08:00",
      horaFin: "18:00",
      cortePreparacion: "16:00",
      timezone: "America/Argentina/Buenos_Aires",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (ventana: VentanaOperativa) => {
    setEditingVentana(ventana);
    setFormData({
      deposito: ventana.deposito,
      diasActivos: ["lun", "mar", "mie", "jue", "vie"],
      horaInicio: ventana.horaInicio,
      horaFin: ventana.horaFin,
      cortePreparacion: ventana.cortePreparacion,
      timezone: ventana.timezone,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.deposito.trim()) {
      toast.error("El depósito es requerido");
      return;
    }

    if (formData.diasActivos.length === 0) {
      toast.error("Selecciona al menos un día");
      return;
    }

    if (formData.horaInicio >= formData.horaFin) {
      toast.error("La hora de inicio debe ser menor a la hora de fin");
      return;
    }

    const diasLabel = formData.diasActivos.length === 7 
      ? "Todos los días"
      : formData.diasActivos.length === 5 && !formData.diasActivos.includes("sab") && !formData.diasActivos.includes("dom")
        ? "Lun-Vie"
        : `${formData.diasActivos.length} días`;

    if (editingVentana) {
      setVentanas(ventanas.map(v => 
        v.id === editingVentana.id 
          ? { ...v, ...formData, dias: diasLabel }
          : v
      ));
      toast.success("Ventana actualizada correctamente");
    } else {
      const newVentana: VentanaOperativa = {
        id: String(Date.now()),
        deposito: formData.deposito,
        dias: diasLabel,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        cortePreparacion: formData.cortePreparacion,
        timezone: formData.timezone,
        excepciones: "0",
      };
      setVentanas([...ventanas, newVentana]);
      toast.success("Ventana creada correctamente");
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteVentana) {
      setVentanas(ventanas.filter(v => v.id !== deleteVentana.id));
      toast.success("Ventana eliminada correctamente");
      setDeleteVentana(null);
    }
  };

  const handleCopyFrom = (ventana: VentanaOperativa) => {
    setFormData({
      deposito: `${ventana.deposito} (Copia)`,
      diasActivos: ["lun", "mar", "mie", "jue", "vie"],
      horaInicio: ventana.horaInicio,
      horaFin: ventana.horaFin,
      cortePreparacion: ventana.cortePreparacion,
      timezone: ventana.timezone,
    });
    setIsModalOpen(true);
    toast.success("Ventana copiada");
  };

  const toggleDia = (diaId: string) => {
    setFormData(prev => ({
      ...prev,
      diasActivos: prev.diasActivos.includes(diaId)
        ? prev.diasActivos.filter(d => d !== diaId)
        : [...prev.diasActivos, diaId]
    }));
  };

  const columns: ColumnDef<VentanaOperativa>[] = [
    {
      accessorKey: "deposito",
      header: createSortableHeader("Depósito"),
    },
    {
      accessorKey: "dias",
      header: "Días",
    },
    {
      accessorKey: "horaInicio",
      header: "Hora inicio",
    },
    {
      accessorKey: "horaFin",
      header: "Hora fin",
    },
    {
      accessorKey: "cortePreparacion",
      header: "Corte preparación",
    },
    {
      accessorKey: "timezone",
      header: "Timezone",
      cell: ({ row }) => row.original.timezone.split("/").pop(),
    },
    {
      accessorKey: "excepciones",
      header: "Excepciones",
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
            <DropdownMenuItem onClick={() => handleCopyFrom(row.original)}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar de este
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setDeleteVentana(row.original)}
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
        newButtonLabel="Nueva ventana"
        showFilters={false}
      />

      {ventanas.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No hay ventanas operativas"
          description="Configura las ventanas horarias de tus depósitos"
          actionLabel="Nueva ventana"
          onAction={handleNew}
        />
      ) : (
        <DataTable columns={columns} data={ventanas} searchValue={searchValue} />
      )}

      {/* Modal Nueva/Editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingVentana ? "Editar ventana operativa" : "Nueva ventana operativa"}
            </DialogTitle>
            <DialogDescription>
              {editingVentana ? "Modifica los horarios y configuración de la ventana operativa" : "Define los horarios y configuración para una nueva ventana operativa"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label htmlFor="deposito">Depósito / Sucursal *</Label>
              <Input
                id="deposito"
                value={formData.deposito}
                onChange={(e) => setFormData({ ...formData, deposito: e.target.value })}
                placeholder="Ej: CD CABA"
                className="bg-white/80"
              />
            </div>

            <div>
              <Label className="mb-3 block">Días de operación *</Label>
              <div className="grid grid-cols-7 gap-2">
                {diasSemana.map((dia) => (
                  <div key={dia.id} className="flex flex-col items-center">
                    <Checkbox
                      id={dia.id}
                      checked={formData.diasActivos.includes(dia.id)}
                      onCheckedChange={() => toggleDia(dia.id)}
                    />
                    <Label htmlFor={dia.id} className="text-xs mt-1 cursor-pointer">
                      {dia.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="horaInicio">Hora inicio</Label>
                <Input
                  id="horaInicio"
                  type="time"
                  value={formData.horaInicio}
                  onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="horaFin">Hora fin</Label>
                <Input
                  id="horaFin"
                  type="time"
                  value={formData.horaFin}
                  onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="cortePreparacion">Corte preparación</Label>
                <Input
                  id="cortePreparacion"
                  type="time"
                  value={formData.cortePreparacion}
                  onChange={(e) => setFormData({ ...formData, cortePreparacion: e.target.value })}
                  className="bg-white/80"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="timezone">Zona horaria</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({ ...formData, timezone: value })}
              >
                <SelectTrigger className="bg-white/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/30">
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Excepciones (feriados/blackout)
                </Label>
                <Button variant="outline" size="sm">
                  Agregar excepción
                </Button>
              </div>
              <p className="text-sm text-gray-600">No hay excepciones configuradas</p>
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
        open={!!deleteVentana}
        onOpenChange={(open) => !open && setDeleteVentana(null)}
        title="Eliminar ventana operativa"
        description={`¿Estás seguro de que deseas eliminar la ventana del depósito "${deleteVentana?.deposito}"?`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}
