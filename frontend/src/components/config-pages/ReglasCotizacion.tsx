import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Calculator, DollarSign } from "lucide-react";
import { DataTable, createSortableHeader } from "../config/DataTable";
import { Toolbar } from "../config/Toolbar";
import { EmptyState } from "../config/EmptyState";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
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

interface ReglaCotizacion {
  id: string;
  rangoKm: string;
  costoBaseRango: number;
  costoPorKmAdicional: number;
  pesoMaximoBase: number;
  costoPorKgAdicional: number;
  volumenMaximoBase: number;
  costoPorVolumenAdicional: number;
}

interface MultiplicadorTransporte {
  id: string;
  medioTransporte: string;
  multiplicadorCosto: number;
}

const mockReglas: ReglaCotizacion[] = [
  {
    id: "1",
    rangoKm: "0 - 10",
    costoBaseRango: 800,
    costoPorKmAdicional: 30,
    pesoMaximoBase: 5,
    costoPorKgAdicional: 60,
    volumenMaximoBase: 20000,
    costoPorVolumenAdicional: 0.005,
  },
  {
    id: "2",
    rangoKm: "10 - 100",
    costoBaseRango: 1500,
    costoPorKmAdicional: 50,
    pesoMaximoBase: 5,
    costoPorKgAdicional: 100,
    volumenMaximoBase: 20000,
    costoPorVolumenAdicional: 0.008,
  },
  {
    id: "3",
    rangoKm: "100 - 500",
    costoBaseRango: 2500,
    costoPorKmAdicional: 60,
    pesoMaximoBase: 5,
    costoPorKgAdicional: 120,
    volumenMaximoBase: 20000,
    costoPorVolumenAdicional: 0.01,
  },
  {
    id: "4",
    rangoKm: "500 - 1000",
    costoBaseRango: 4000,
    costoPorKmAdicional: 75,
    pesoMaximoBase: 5,
    costoPorKgAdicional: 150,
    volumenMaximoBase: 20000,
    costoPorVolumenAdicional: 0.012,
  },
  {
    id: "5",
    rangoKm: "1000 - 2000",
    costoBaseRango: 6000,
    costoPorKmAdicional: 90,
    pesoMaximoBase: 5,
    costoPorKgAdicional: 200,
    volumenMaximoBase: 20000,
    costoPorVolumenAdicional: 0.015,
  },
];

const multiplicadoresTransporte: MultiplicadorTransporte[] = [
  { id: "truck", medioTransporte: "Camion", multiplicadorCosto: 1 },
  { id: "plane", medioTransporte: "Avion", multiplicadorCosto: 2.5 },
  { id: "train", medioTransporte: "Tren", multiplicadorCosto: 1.5 },
  { id: "ship", medioTransporte: "Barco", multiplicadorCosto: 1.8 },
];

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

const decimalFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 2,
});

const volumetricFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function parseRangoKm(rango: string) {
  const [minRaw = "0", maxRaw = "0"] = rango.split("-").map(part => part.trim());

  const parseValue = (value: string) => {
    const cleaned = value.replace(/[^0-9+]/g, "");
    if (!cleaned) {
      return 0;
    }
    return Number(cleaned.replace("+", ""));
  };

  const minKm = parseValue(minRaw);
  const maxKm = parseValue(maxRaw);

  return {
    minKm,
    maxKm: maxKm || minKm,
  };
}

type ReglaForm = Omit<ReglaCotizacion, "id">;

type SimulatorData = {
  distanciaKm: number;
  pesoKg: number;
  volumenCm3: number;
  medioTransporte: string;
};

interface DetalleCotizacion {
  base: number;
  recargoKm: number;
  kmExtra: number;
  recargoPeso: number;
  pesoExtra: number;
  recargoVolumen: number;
  volumenExtra: number;
  subtotal: number;
  multiplicador: number;
  total: number;
  limiteKm: number;
}

const obtenerMultiplicador = (medio: string) =>
  multiplicadoresTransporte.find(item => item.medioTransporte === medio)?.multiplicadorCosto ?? 1;

const calcularDetalleCotizacion = (regla: ReglaForm, datos: SimulatorData): DetalleCotizacion => {
  const { maxKm } = parseRangoKm(regla.rangoKm);

  const distancia = Math.max(0, datos.distanciaKm);
  const limiteKm = maxKm > 0 ? maxKm : distancia;
  const kmExtra = Math.max(0, distancia - limiteKm);

  const pesoExtra = Math.max(0, datos.pesoKg - Math.max(regla.pesoMaximoBase, 0));
  const volumenExtra = Math.max(0, datos.volumenCm3 - Math.max(regla.volumenMaximoBase, 0));

  const base = Math.max(regla.costoBaseRango, 0);
  const recargoKm = kmExtra * Math.max(regla.costoPorKmAdicional, 0);
  const recargoPeso = pesoExtra * Math.max(regla.costoPorKgAdicional, 0);
  const recargoVolumen = volumenExtra * Math.max(regla.costoPorVolumenAdicional, 0);

  const subtotal = base + recargoKm + recargoPeso + recargoVolumen;
  const multiplicador = obtenerMultiplicador(datos.medioTransporte);
  const total = subtotal * multiplicador;

  return {
    base,
    recargoKm,
    kmExtra,
    recargoPeso,
    pesoExtra,
    recargoVolumen,
    volumenExtra,
    subtotal,
    multiplicador,
    total,
    limiteKm,
  };
};

export function ReglasCotizacion() {
  const [searchValue, setSearchValue] = useState("");
  const [reglas, setReglas] = useState<ReglaCotizacion[]>(mockReglas);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegla, setEditingRegla] = useState<ReglaCotizacion | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);

  const [formData, setFormData] = useState<ReglaForm>({
    rangoKm: "",
    costoBaseRango: 0,
    costoPorKmAdicional: 0,
    pesoMaximoBase: 0,
    costoPorKgAdicional: 0,
    volumenMaximoBase: 0,
    costoPorVolumenAdicional: 0,
  });

  const [simulatorData, setSimulatorData] = useState<SimulatorData>({
    distanciaKm: 10,
    pesoKg: 5,
    volumenCm3: 10000,
    medioTransporte: multiplicadoresTransporte[0].medioTransporte,
  });

  const handleNew = () => {
    setEditingRegla(null);
    setFormData({
      rangoKm: "",
      costoBaseRango: 0,
      costoPorKmAdicional: 0,
      pesoMaximoBase: 0,
      costoPorKgAdicional: 0,
      volumenMaximoBase: 0,
      costoPorVolumenAdicional: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (regla: ReglaCotizacion) => {
    const { id, ...rest } = regla;
    setEditingRegla(regla);
    setFormData(rest);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const rangoSanitizado = formData.rangoKm.trim();

    if (!rangoSanitizado) {
      toast.error("El campo Rango_KM es requerido");
      return;
    }

    const numericValues = [
      formData.costoBaseRango,
      formData.costoPorKmAdicional,
      formData.pesoMaximoBase,
      formData.costoPorKgAdicional,
      formData.volumenMaximoBase,
      formData.costoPorVolumenAdicional,
    ];

    if (numericValues.some(value => Number.isNaN(value) || value < 0)) {
      toast.error("Los valores deben ser mayores o iguales a 0");
      return;
    }

    const payload: ReglaForm = {
      ...formData,
      rangoKm: rangoSanitizado,
    };

    if (editingRegla) {
      setReglas(reglas.map(regla => (regla.id === editingRegla.id ? { ...regla, ...payload } : regla)));
      toast.success("Regla actualizada correctamente");
    } else {
      const newRegla: ReglaCotizacion = {
        id: String(Date.now()),
        ...payload,
      };
      setReglas([...reglas, newRegla]);
      toast.success("Regla creada correctamente");
    }

    setIsModalOpen(false);
  };

  const detalleCotizacion = useMemo(
    () => calcularDetalleCotizacion(formData, simulatorData),
    [formData, simulatorData]
  );

  const columns: ColumnDef<ReglaCotizacion>[] = [
    {
      id: "index",
      header: "#",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 text-white flex items-center justify-center">
          {row.index + 1}
        </div>
      ),
    },
    {
      accessorKey: "rangoKm",
      header: createSortableHeader("Rango_KM"),
    },
    {
      accessorKey: "costoBaseRango",
      header: createSortableHeader("Costo_Base_Rango"),
      cell: ({ row }) => currencyFormatter.format(row.original.costoBaseRango),
    },
    {
      accessorKey: "costoPorKmAdicional",
      header: "Costo_Por_Km_Adicional",
      cell: ({ row }) => currencyFormatter.format(row.original.costoPorKmAdicional),
    },
    {
      accessorKey: "pesoMaximoBase",
      header: "Peso_Maximo_Base",
      cell: ({ row }) => `${row.original.pesoMaximoBase} kg`,
    },
    {
      accessorKey: "costoPorKgAdicional",
      header: "Costo_Por_Kg_Adicional",
      cell: ({ row }) => currencyFormatter.format(row.original.costoPorKgAdicional),
    },
    {
      accessorKey: "volumenMaximoBase",
      header: "Volumen_Maximo_Base",
      cell: ({ row }) => `${row.original.volumenMaximoBase.toLocaleString("es-AR")} cm^3`,
    },
    {
      accessorKey: "costoPorVolumenAdicional",
      header: "Costo_Por_Volumen_Adicional",
      cell: ({ row }) => volumetricFormatter.format(row.original.costoPorVolumenAdicional),
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
                const { id, ...rest } = row.original;
                setFormData(rest);
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
          title="No hay reglas de cotizacion"
          description="Configura las reglas de pricing para tus servicios"
          actionLabel="Nueva regla"
          onAction={handleNew}
        />
      ) : (
        <DataTable columns={columns} data={reglas} searchValue={searchValue} />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRegla ? "Editar regla de cotizacion" : "Nueva regla de cotizacion"}
            </DialogTitle>
            <DialogDescription>
              Completa los valores que aplican al rango seleccionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rangoKm">Rango_KM *</Label>
              <Input
                id="rangoKm"
                value={formData.rangoKm}
                onChange={(e) => setFormData({ ...formData, rangoKm: e.target.value })}
                placeholder="Ej: 0 - 10"
                className="bg-white/80"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="costoBaseRango">Costo_Base_Rango (ARS)</Label>
                <Input
                  id="costoBaseRango"
                  type="number"
                  min="0"
                  value={formData.costoBaseRango}
                  onChange={(e) => setFormData({ ...formData, costoBaseRango: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="costoPorKmAdicional">Costo_Por_Km_Adicional (ARS)</Label>
                <Input
                  id="costoPorKmAdicional"
                  type="number"
                  min="0"
                  value={formData.costoPorKmAdicional}
                  onChange={(e) => setFormData({ ...formData, costoPorKmAdicional: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="pesoMaximoBase">Peso_Maximo_Base (kg)</Label>
                <Input
                  id="pesoMaximoBase"
                  type="number"
                  min="0"
                  value={formData.pesoMaximoBase}
                  onChange={(e) => setFormData({ ...formData, pesoMaximoBase: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="costoPorKgAdicional">Costo_Por_Kg_Adicional (ARS)</Label>
                <Input
                  id="costoPorKgAdicional"
                  type="number"
                  min="0"
                  value={formData.costoPorKgAdicional}
                  onChange={(e) => setFormData({ ...formData, costoPorKgAdicional: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="volumenMaximoBase">Volumen_Maximo_Base (cm^3)</Label>
                <Input
                  id="volumenMaximoBase"
                  type="number"
                  min="0"
                  value={formData.volumenMaximoBase}
                  onChange={(e) => setFormData({ ...formData, volumenMaximoBase: Number(e.target.value) })}
                  className="bg-white/80"
                />
              </div>
              <div>
                <Label htmlFor="costoPorVolumenAdicional">Costo_Por_Volumen_Adicional (ARS/cm^3)</Label>
                <Input
                  id="costoPorVolumenAdicional"
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.costoPorVolumenAdicional}
                  onChange={(e) =>
                    setFormData({ ...formData, costoPorVolumenAdicional: Number(e.target.value) })
                  }
                  className="bg-white/80"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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

      <Dialog open={showSimulator} onOpenChange={setShowSimulator}>
        <DialogContent className="backdrop-blur-xl bg-white/95 max-w-xl">
          <DialogHeader>
            <DialogTitle>Simulador de cotizacion - {formData.rangoKm || "N/D"}</DialogTitle>
            <DialogDescription>
              Estima el costo segun la regla seleccionada y el medio de transporte aplicado.
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
                  onChange={(e) =>
                    setSimulatorData({ ...simulatorData, distanciaKm: Number(e.target.value) })
                  }
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
                  onChange={(e) =>
                    setSimulatorData({ ...simulatorData, pesoKg: Number(e.target.value) })
                  }
                  className="bg-white/80"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="volumen">Volumen (cm^3)</Label>
              <Input
                id="volumen"
                type="number"
                min="0"
                value={simulatorData.volumenCm3}
                onChange={(e) =>
                  setSimulatorData({ ...simulatorData, volumenCm3: Number(e.target.value) })
                }
                className="bg-white/80"
              />
            </div>

            <div>
              <Label htmlFor="medioTransporte">Medio de transporte</Label>
              <Select
                value={simulatorData.medioTransporte}
                onValueChange={(value) =>
                  setSimulatorData({ ...simulatorData, medioTransporte: value })
                }
              >
                <SelectTrigger id="medioTransporte" className="bg-white/80">
                  <SelectValue placeholder="Selecciona un medio" />
                </SelectTrigger>
                <SelectContent>
                  {multiplicadoresTransporte.map(item => (
                    <SelectItem key={item.id} value={item.medioTransporte}>
                      {item.medioTransporte}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-teal-50 border-purple-200">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>
                    Costo base (hasta {detalleCotizacion.limiteKm.toLocaleString("es-AR")} km):
                  </span>
                  <span>{currencyFormatter.format(detalleCotizacion.base)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Kilometros extra ({decimalFormatter.format(detalleCotizacion.kmExtra)} km x{" "}
                    {currencyFormatter.format(formData.costoPorKmAdicional)}):
                  </span>
                  <span>{currencyFormatter.format(detalleCotizacion.recargoKm)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Peso excedente ({decimalFormatter.format(detalleCotizacion.pesoExtra)} kg x{" "}
                    {currencyFormatter.format(formData.costoPorKgAdicional)}):
                  </span>
                  <span>{currencyFormatter.format(detalleCotizacion.recargoPeso)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Volumen excedente ({detalleCotizacion.volumenExtra.toLocaleString("es-AR")} cm^3 x{" "}
                    {volumetricFormatter.format(formData.costoPorVolumenAdicional)}):
                  </span>
                  <span>{currencyFormatter.format(detalleCotizacion.recargoVolumen)}</span>
                </div>
                <div className="flex justify-between text-purple-700 font-medium">
                  <span>Subtotal:</span>
                  <span>{currencyFormatter.format(detalleCotizacion.subtotal)}</span>
                </div>
                <div className="flex justify-between text-purple-700">
                  <span>Multiplicador {simulatorData.medioTransporte}:</span>
                  <span>{decimalFormatter.format(detalleCotizacion.multiplicador)}x</span>
                </div>
                <div className="border-t border-purple-300 pt-2 mt-2 flex justify-between">
                  <span>Total:</span>
                  <span className="text-purple-700">{currencyFormatter.format(detalleCotizacion.total)}</span>
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
