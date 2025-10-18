import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Calculator, DollarSign } from "lucide-react";
import { DataTable, createSortableHeader } from "../config/DataTable";
import { Toolbar } from "../config/Toolbar";
import { EmptyState } from "../config/EmptyState";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Card } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";

interface ReglaCotizacion {
  id: string;
  servicio: string;
  base: number;
  porKm: number;
  porKg: number;
  volumetrico: boolean;
  zonasEspeciales: number;
  horariosPico: number;
  prioridad: number;
}

const mockReglas: ReglaCotizacion[] = [
  {
    id: "1",
    servicio: "Estándar",
    base: 500,
    porKm: 25,
    porKg: 5,
    volumetrico: true,
    zonasEspeciales: 10,
    horariosPico: 15,
    prioridad: 1,
  },
  {
    id: "2",
    servicio: "Exprés",
    base: 800,
    porKm: 35,
    porKg: 8,
    volumetrico: true,
    zonasEspeciales: 15,
    horariosPico: 20,
    prioridad: 2,
  },
  {
    id: "3",
    servicio: "Same-day",
    base: 1200,
    porKm: 50,
    porKg: 10,
    volumetrico: true,
    zonasEspeciales: 25,
    horariosPico: 30,
    prioridad: 3,
  },
];

export function ReglasCotizacion() {
  const [searchValue, setSearchValue] = useState("");
  const [reglas, setReglas] = useState<ReglaCotizacion[]>(mockReglas);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegla, setEditingRegla] = useState<ReglaCotizacion | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);

  const [formData, setFormData] = useState({
    servicio: "",
    base: 0,
    porKm: 0,
    porKg: 0,
    volumetrico: true,
    zonasEspeciales: 0,
    horariosPico: 0,
    prioridad: 1,
  });

  const [simulatorData, setSimulatorData] = useState({
    distanciaKm: 10,
    pesoKg: 5,
    volumenCm3: 10000,
    zona: "normal",
    horaPico: false,
  });

  const handleNew = () => {
    setEditingRegla(null);
    setFormData({
      servicio: "",
      base: 0,
      porKm: 0,
      porKg: 0,
      volumetrico: true,
      zonasEspeciales: 0,
      horariosPico: 0,
      prioridad: reglas.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (regla: ReglaCotizacion) => {
    setEditingRegla(regla);
    setFormData(regla);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.servicio.trim()) {
      toast.error("El nombre del servicio es requerido");
      return;
    }

    if (formData.base < 0 || formData.porKm < 0 || formData.porKg < 0) {
      toast.error("Los valores deben ser mayores o iguales a 0");
      return;
    }

    if (editingRegla) {
      setReglas(reglas.map(r => 
        r.id === editingRegla.id ? { ...r, ...formData } : r
      ));
      toast.success("Regla actualizada correctamente");
    } else {
      const newRegla: ReglaCotizacion = {
        id: String(Date.now()),
        ...formData,
      };
      setReglas([...reglas, newRegla]);
      toast.success("Regla creada correctamente");
    }
    setIsModalOpen(false);
  };

  const calcularCotizacion = () => {
    let total = formData.base;
    total += simulatorData.distanciaKm * formData.porKm;
    
    let pesoFinal = simulatorData.pesoKg;
    if (formData.volumetrico) {
      const pesoVolumetrico = simulatorData.volumenCm3 / 5000;
      pesoFinal = Math.max(pesoFinal, pesoVolumetrico);
    }
    total += pesoFinal * formData.porKg;

    if (simulatorData.zona === "especial") {
      total += total * (formData.zonasEspeciales / 100);
    }

    if (simulatorData.horaPico) {
      total += total * (formData.horariosPico / 100);
    }

    return total;
  };

  const columns: ColumnDef<ReglaCotizacion>[] = [
    {
      accessorKey: "prioridad",
      header: createSortableHeader("#"),
      cell: ({ row }) => (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 text-white flex items-center justify-center">
          {row.original.prioridad}
        </div>
      ),
    },
    {
      accessorKey: "servicio",
      header: createSortableHeader("Servicio"),
    },
    {
      accessorKey: "base",
      header: createSortableHeader("Base"),
      cell: ({ row }) => `$${row.original.base.toLocaleString()}`,
    },
    {
      accessorKey: "porKm",
      header: "Por km",
      cell: ({ row }) => `$${row.original.porKm}`,
    },
    {
      accessorKey: "porKg",
      header: "Por kg",
      cell: ({ row }) => `$${row.original.porKg}`,
    },
    {
      accessorKey: "volumetrico",
      header: "Vol.",
      cell: ({ row }) => row.original.volumetrico ? "✓" : "-",
    },
    {
      accessorKey: "zonasEspeciales",
      header: "Zonas +",
      cell: ({ row }) => `${row.original.zonasEspeciales}%`,
    },
    {
      accessorKey: "horariosPico",
      header: "H. Pico +",
      cell: ({ row }) => `${row.original.horariosPico}%`,
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
              onClick={() => {
                setFormData(row.original);
                setShowSimulator(true);
              }}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Simular
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
        newButtonLabel="Nueva regla"
        showFilters={false}
      />

      {reglas.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No hay reglas de cotización"
          description="Configura las reglas de pricing para tus servicios"
          actionLabel="Nueva regla"
          onAction={handleNew}
        />
      ) : (
        <DataTable columns={columns} data={reglas} searchValue={searchValue} />
      )}

      {/* Modal Nueva/Editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRegla ? "Editar regla de cotización" : "Nueva regla de cotización"}
            </DialogTitle>
            <DialogDescription>
              {editingRegla ? "Modifica los parámetros de la regla de cotización" : "Define los parámetros para una nueva regla de cotización"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="servicio">Servicio *</Label>
              <Input
                id="servicio"
                value={formData.servicio}
                onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                placeholder="Ej: Estándar, Exprés"
                className="bg-white/80"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base">Tarifa base ($)</Label>
                <Input
                  id="base"
                  type="number"
                  min="0"
                  value={formData.base}
                  onChange={(e) => setFormData({ ...formData, base: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="prioridad">Prioridad</Label>
                <Input
                  id="prioridad"
                  type="number"
                  min="1"
                  value={formData.prioridad}
                  onChange={(e) => setFormData({ ...formData, prioridad: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="porKm">Por kilómetro ($)</Label>
                <Input
                  id="porKm"
                  type="number"
                  min="0"
                  value={formData.porKm}
                  onChange={(e) => setFormData({ ...formData, porKm: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="porKg">Por kilogramo ($)</Label>
                <Input
                  id="porKg"
                  type="number"
                  min="0"
                  value={formData.porKg}
                  onChange={(e) => setFormData({ ...formData, porKg: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="volumetrico"
                checked={formData.volumetrico}
                onCheckedChange={(checked) => setFormData({ ...formData, volumetrico: checked })}
              />
              <Label htmlFor="volumetrico">
                Calcular peso volumétrico (L×W×H)/5000
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zonasEspeciales">Recargo zonas especiales (%)</Label>
                <Input
                  id="zonasEspeciales"
                  type="number"
                  min="0"
                  value={formData.zonasEspeciales}
                  onChange={(e) => setFormData({ ...formData, zonasEspeciales: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="horariosPico">Recargo horarios pico (%)</Label>
                <Input
                  id="horariosPico"
                  type="number"
                  min="0"
                  value={formData.horariosPico}
                  onChange={(e) => setFormData({ ...formData, horariosPico: Number(e.target.value) })}
                  className="bg-white/80"
                />
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

      {/* Simulador */}
      <Dialog open={showSimulator} onOpenChange={setShowSimulator}>
        <DialogContent className="backdrop-blur-xl bg-white/95 max-w-xl">
          <DialogHeader>
            <DialogTitle>Simulador de cotización - {formData.servicio}</DialogTitle>
            <DialogDescription>
              Simula una cotización para visualizar cómo se aplican las reglas configuradas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="distancia">Distancia (km)</Label>
                <Input
                  id="distancia"
                  type="number"
                  min="0"
                  value={simulatorData.distanciaKm}
                  onChange={(e) => setSimulatorData({ ...simulatorData, distanciaKm: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="peso">Peso (kg)</Label>
                <Input
                  id="peso"
                  type="number"
                  min="0"
                  value={simulatorData.pesoKg}
                  onChange={(e) => setSimulatorData({ ...simulatorData, pesoKg: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="volumen">Volumen (cm³)</Label>
              <Input
                id="volumen"
                type="number"
                min="0"
                value={simulatorData.volumenCm3}
                onChange={(e) => setSimulatorData({ ...simulatorData, volumenCm3: Number(e.target.value) })}
                className="bg-white/80"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="zonaEspecial"
                  checked={simulatorData.zona === "especial"}
                  onCheckedChange={(checked) => 
                    setSimulatorData({ ...simulatorData, zona: checked ? "especial" : "normal" })
                  }
                />
                <Label htmlFor="zonaEspecial">Zona especial</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="horaPico"
                  checked={simulatorData.horaPico}
                  onCheckedChange={(checked) => 
                    setSimulatorData({ ...simulatorData, horaPico: checked })
                  }
                />
                <Label htmlFor="horaPico">Horario pico</Label>
              </div>
            </div>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-teal-50 border-purple-200">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Tarifa base:</span>
                  <span>${formData.base.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Distancia ({simulatorData.distanciaKm} km × ${formData.porKm}):</span>
                  <span>${(simulatorData.distanciaKm * formData.porKm).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Peso:</span>
                  <span>${(simulatorData.pesoKg * formData.porKg).toLocaleString()}</span>
                </div>
                {simulatorData.zona === "especial" && (
                  <div className="flex justify-between text-amber-700">
                    <span>Recargo zona especial ({formData.zonasEspeciales}%):</span>
                    <span>+${((calcularCotizacion() * formData.zonasEspeciales) / (100 + formData.zonasEspeciales)).toLocaleString()}</span>
                  </div>
                )}
                {simulatorData.horaPico && (
                  <div className="flex justify-between text-amber-700">
                    <span>Recargo horario pico ({formData.horariosPico}%):</span>
                    <span>+${((calcularCotizacion() * formData.horariosPico) / (100 + formData.horariosPico)).toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-purple-300 pt-2 mt-2 flex justify-between">
                  <span>Total:</span>
                  <span className="text-purple-700">${calcularCotizacion().toLocaleString()}</span>
                </div>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowSimulator(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
