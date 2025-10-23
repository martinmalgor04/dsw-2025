import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
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
      licensePlate: data.licensePlate as string,
      make: data.make as string,
      model: data.model as string,
      year: parseInt(data.year as string),
      capacityKg: parseInt(data.capacityKg as string),
      volumeM3: parseFloat(data.volumeM3 as string),
      fuelType: data.fuelType as 'DIESEL' | 'GASOLINE' | 'ELECTRIC' | 'GNC',
    };

    if (editingVehiculo) {
      const updatedData: UpdateVehicleDTO = {
        ...vehicleData,
        status: editingVehiculo.status,
      };
      update(editingVehiculo.id, updatedData);
    } else {
      const newData: CreateVehicleDTO = vehicleData;
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
    { accessorKey: 'licensePlate', header: 'Patente' },
    { accessorKey: 'make', header: 'Marca' },
    { accessorKey: 'model', header: 'Modelo' },
    { accessorKey: 'year', header: 'Año' },
    { accessorKey: 'capacityKg', header: 'Capacidad (Kg)' },
    { accessorKey: 'volumeM3', header: 'Volumen (m³)' },
    { accessorKey: 'fuelType', header: 'Combustible' },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }: any) => {
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
      cell: ({ row }: any) => {
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
        title="Vehículos"
        onSearch={(value) => setFilters({ search: value })}
        rightContent={
          <Button onClick={() => setDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Vehículo
          </Button>
        }
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVehiculo ? 'Editar' : 'Añadir'} Vehículo</DialogTitle>
            <DialogDescription>
              Completa los detalles del vehículo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <Input name="licensePlate" defaultValue={editingVehiculo?.licensePlate} placeholder="Patente" required />
              <Input name="make" defaultValue={editingVehiculo?.make} placeholder="Marca" required />
              <Input name="model" defaultValue={editingVehiculo?.model} placeholder="Modelo" required />
              <Input name="year" type="number" defaultValue={editingVehiculo?.year} placeholder="Año" required />
              <Input name="capacityKg" type="number" defaultValue={editingVehiculo?.capacityKg} placeholder="Capacidad (Kg)" required />
              <Input name="volumeM3" type="number" step="0.1" defaultValue={editingVehiculo?.volumeM3} placeholder="Volumen (m³)" required />
              <Input name="fuelType" defaultValue={editingVehiculo?.fuelType} placeholder="Tipo de Combustible" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteVehiculo}
        onOpenChange={() => setDeleteVehiculo(null)}
        onConfirm={handleDeleteConfirm}
        title="¿Estás seguro?"
        description={`Se eliminará permanentemente el vehículo con patente ${deleteVehiculo?.licensePlate}.`}
      />
    </div>
  );
}
