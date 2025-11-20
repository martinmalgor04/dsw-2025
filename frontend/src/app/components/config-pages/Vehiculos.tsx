import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '../config/ConfirmDialog';
import { Toolbar } from '../config/Toolbar';
import { EmptyState } from '../config/EmptyState';
import { useVehicles } from '@/lib/middleware/stores/composables/useVehicles';
import type { VehicleDTO, CreateVehicleDTO, UpdateVehicleDTO } from '@/lib/middleware/services/vehicle.service';
import { DataTable } from '../config/DataTable';

type VehiculoDisplay = VehicleDTO;

export function Vehiculos() {
  const {
    items: vehiculos,
    isLoading,
    error,
    create,
    update,
    remove,
    setFilters,
  } = useVehicles();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<VehiculoDisplay | null>(null);
  const [deleteVehiculo, setDeleteVehiculo] = useState<VehiculoDisplay | null>(null);

  const filteredVehiculos = useMemo(() => {
    return vehiculos;
  }, [vehiculos]);

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const vehicleData = {
      license_plate: data.license_plate as string,
      make: data.make as string,
      model: data.model as string,
      year: parseInt(data.year as string),
      capacityKg: parseInt(data.capacityKg as string),
      volumeM3: parseFloat(data.volumeM3 as string),
      fuelType: data.fuelType as 'DIESEL' | 'GASOLINE' | 'ELECTRIC' | 'HYBRID',
    };

    if (editingVehiculo) {
      const updatedData: UpdateVehicleDTO = {
        ...vehicleData,
        status: editingVehiculo.status,
      };
      update(editingVehiculo.id, updatedData);
    } else {
      const newData: CreateVehicleDTO = {
        ...vehicleData,
        status: 'AVAILABLE',
      };
      create(newData);
    }

    setDialogOpen(false);
    setEditingVehiculo(null);
  };

  const handleEdit = (vehiculo: VehiculoDisplay) => {
    setEditingVehiculo(vehiculo);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteVehiculo) {
      remove(deleteVehiculo.id);
      setDeleteVehiculo(null);
    }
  };

  const columns = [
    { accessorKey: 'license_plate', header: 'Patente' },
    { accessorKey: 'make', header: 'Marca' },
    { accessorKey: 'model', header: 'Modelo' },
    { accessorKey: 'year', header: 'Año' },
    { accessorKey: 'capacityKg', header: 'Capacidad (Kg)' },
    { accessorKey: 'volumeM3', header: 'Volumen (m³)' },
    { accessorKey: 'fuelType', header: 'Combustible' },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }: { row: { original: VehiculoDisplay } }) => {
        const status = row.original.status;
        return (
          <Badge variant={status === 'AVAILABLE' ? 'default' : 'secondary'}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: VehiculoDisplay } }) => {
        const vehiculo = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(vehiculo)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteVehiculo(vehiculo)}>
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div>
      <Toolbar
        searchValue=""
        onSearchChange={() => setFilters({})}
        onNewClick={() => setDialogOpen(true)}
        newButtonLabel="Añadir Vehículo"
      />

      {isLoading && <p>Cargando...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && !error && (
        <>
          {filteredVehiculos.length > 0 ? (
            <DataTable columns={columns} data={filteredVehiculos} />
          ) : (
            <EmptyState
              title="No se encontraron vehículos"
              description="Añade un nuevo vehículo para empezar a gestionar tu flota."
            />
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {editingVehiculo ? 'Editar' : 'Añadir'} Vehículo
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              {editingVehiculo
                ? 'Modifica los datos del vehículo en el sistema.'
                : 'Completa el formulario para añadir un nuevo vehículo a tu flota.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="mt-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="license_plate" className="text-sm font-semibold text-gray-700">
                  Patente *
                </Label>
                <Input 
                  id="license_plate" 
                  name="license_plate" 
                  defaultValue={editingVehiculo?.license_plate} 
                  required 
                  minLength={6}
                  maxLength={10}
                  placeholder="ABC123"
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="make" className="text-sm font-semibold text-gray-700">
                  Marca *
                </Label>
                <Input 
                  id="make" 
                  name="make" 
                  defaultValue={editingVehiculo?.make} 
                  required 
                  minLength={2}
                  maxLength={50}
                  placeholder="Ej: Scania"
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model" className="text-sm font-semibold text-gray-700">
                  Modelo *
                </Label>
                <Input 
                  id="model" 
                  name="model" 
                  defaultValue={editingVehiculo?.model} 
                  required 
                  minLength={2}
                  maxLength={50}
                  placeholder="Ej: R450"
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year" className="text-sm font-semibold text-gray-700">
                  Año *
                </Label>
                <Input 
                  id="year" 
                  name="year" 
                  type="number" 
                  defaultValue={editingVehiculo?.year} 
                  required 
                  min="1990"
                  max="2025"
                  placeholder="2024"
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacityKg" className="text-sm font-semibold text-gray-700">
                  Capacidad (Kg) *
                </Label>
                <Input 
                  id="capacityKg" 
                  name="capacityKg" 
                  type="number" 
                  defaultValue={editingVehiculo?.capacityKg} 
                  required 
                  min="1"
                  max="50000"
                  placeholder="Ej: 20000"
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="volumeM3" className="text-sm font-semibold text-gray-700">
                  Volumen (m³) *
                </Label>
                <Input 
                  id="volumeM3" 
                  name="volumeM3" 
                  type="number" 
                  step="0.1" 
                  defaultValue={editingVehiculo?.volumeM3} 
                  required 
                  min="0.1"
                  max="100"
                  placeholder="Ej: 45.5"
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuelType" className="text-sm font-semibold text-gray-700">
                  Tipo de Combustible *
                </Label>
                <select 
                  id="fuelType" 
                  name="fuelType" 
                  defaultValue={editingVehiculo?.fuelType || 'GASOLINE'} 
                  className="w-full h-9 px-3 py-2 text-black bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder:text-gray-400"
                  required
                >
                  <option value="GASOLINE">Gasolina</option>
                  <option value="DIESEL">Diésel</option>
                  <option value="ELECTRIC">Eléctrico</option>
                  <option value="HYBRID">Híbrido</option>
                </select>
              </div>
              {editingVehiculo && (
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
                    Estado *
                  </Label>
                  <select 
                    id="status" 
                    name="status" 
                    defaultValue={editingVehiculo?.status || 'AVAILABLE'} 
                    className="w-full h-9 px-3 py-2 text-black bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder:text-gray-400"
                    required
                  >
                    <option value="AVAILABLE">Disponible</option>
                    <option value="IN_USE">En Uso</option>
                    <option value="MAINTENANCE">Mantenimiento</option>
                    <option value="OUT_OF_SERVICE">Fuera de Servicio</option>
                  </select>
                </div>
              )}
            </div>
            <DialogFooter className="mt-8 pt-6 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                className="px-6"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="px-6 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white shadow-md"
              >
                {editingVehiculo ? 'Actualizar' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteVehiculo}
        onOpenChange={() => setDeleteVehiculo(null)}
        onConfirm={handleDeleteConfirm}
        title="¿Estás seguro?"
        description={`Se eliminará permanentemente el vehículo con patente ${deleteVehiculo?.license_plate}.`}
      />
    </div>
  );
}
