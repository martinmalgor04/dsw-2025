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
import { useDrivers } from '@/lib/middleware/stores/composables/useDrivers';
import type { DriverDTO, CreateDriverDTO, UpdateDriverDTO } from '@/lib/middleware/services/driver.service';
import { DataTable } from '../config/DataTable';

// Renombramos la interfaz local para evitar conflictos
type ConductorDisplay = DriverDTO;

export function Conductores() {
  const {
    items: conductores,
    isLoading,
    error,
    create,
    update,
    remove,
    setFilters,
  } = useDrivers();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConductor, setEditingConductor] = useState<ConductorDisplay | null>(null);
  const [deleteConductor, setDeleteConductor] = useState<ConductorDisplay | null>(null);

  const filteredConductores = useMemo(() => {
    // La lógica de filtrado ahora se podría delegar al store/hook
    return conductores;
  }, [conductores]);

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries()) as unknown as CreateDriverDTO & { id?: string };

    if (editingConductor) {
      const updatedData: UpdateDriverDTO = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        licenseType: data.licenseType,
        status: editingConductor.status, // O tomarlo de un campo si se puede editar
      };
      update(editingConductor.id, updatedData);
    } else {
      const newData: CreateDriverDTO = {
        // El backend debería asignar el employeeId, o si es manual, añadirlo al form.
        employeeId: `EMP-${Math.floor(Math.random() * 10000)}`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        licenseType: data.licenseType as any,
      };
      create(newData);
    }

    setDialogOpen(false);
    setEditingConductor(null);
  };

  const handleEdit = (conductor: ConductorDisplay) => {
    setEditingConductor(conductor);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteConductor) {
      remove(deleteConductor.id);
      setDeleteConductor(null);
    }
  };

  const columns = [
    { accessorKey: 'firstName', header: 'Nombre' },
    { accessorKey: 'lastName', header: 'Apellido' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Teléfono' },
    { accessorKey: 'licenseNumber', header: 'Licencia' },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }: any) => {
        const status = row.original.status;
        return (
          <Badge variant={status === 'ACTIVE' ? 'default' : 'destructive'}>
            {status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        const conductor = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(conductor)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteConductor(conductor)}>
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
        title="Conductores"
        onSearch={(value) => setFilters({ search: value })}
        rightContent={
          <Button onClick={() => setDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Conductor
          </Button>
        }
      />

      {isLoading && <p>Cargando...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && !error && (
        <>
          {filteredConductores.length > 0 ? (
            <DataTable columns={columns} data={filteredConductores} />
          ) : (
            <EmptyState
              title="No se encontraron conductores"
              description="No hay conductores que coincidan con tu búsqueda. Intenta con otros filtros."
            />
          )}
        </>
      )}

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingConductor ? 'Editar' : 'Añadir'} Conductor</DialogTitle>
            <DialogDescription>
              {editingConductor
                ? 'Modifica los datos del conductor.'
                : 'Añade un nuevo conductor al sistema.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">Nombre</Label>
                <Input id="firstName" name="firstName" defaultValue={editingConductor?.firstName} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">Apellido</Label>
                <Input id="lastName" name="lastName" defaultValue={editingConductor?.lastName} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={editingConductor?.email} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Teléfono</Label>
                <Input id="phone" name="phone" defaultValue={editingConductor?.phone} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="licenseNumber" className="text-right">Licencia</Label>
                <Input id="licenseNumber" name="licenseNumber" defaultValue={editingConductor?.licenseNumber} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="licenseType" className="text-right">Tipo</Label>
                <Input id="licenseType" name="licenseType" defaultValue={editingConductor?.licenseType} className="col-span-3" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConductor}
        onOpenChange={() => setDeleteConductor(null)}
        onConfirm={handleDeleteConfirm}
        title="¿Estás seguro?"
        description={`Esta acción no se puede deshacer. Se eliminará permanentemente el conductor ${deleteConductor?.firstName} ${deleteConductor?.lastName}.`}
      />
    </div>
  );
}




