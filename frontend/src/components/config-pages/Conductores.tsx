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
  
  // Debug: log cuando cambia el estado del dialog
  console.log('Dialog open state:', dialogOpen);
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
        licenseType: data.licenseType as 'A' | 'B' | 'C' | 'D',
        status: 'ACTIVE',
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
      cell: ({ row }: { row: { original: ConductorDisplay } }) => {
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
      cell: ({ row }: { row: { original: ConductorDisplay } }) => {
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
        searchValue=""
        onSearchChange={() => setFilters({})}
        onNewClick={() => {
          console.log('Botón Añadir Conductor clickeado');
          setDialogOpen(true);
        }}
        newButtonLabel="Añadir Conductor"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingConductor ? 'Editar' : 'Añadir'} Conductor</DialogTitle>
            <DialogDescription>
              {editingConductor
                ? 'Modifica los datos del conductor.'
                : 'Añade un nuevo conductor al sistema.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">Nombre *</Label>
                <Input 
                  id="firstName" 
                  name="firstName" 
                  defaultValue={editingConductor?.firstName} 
                  required 
                  minLength={2}
                  maxLength={50}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Apellido *</Label>
                <Input 
                  id="lastName" 
                  name="lastName" 
                  defaultValue={editingConductor?.lastName} 
                  required 
                  minLength={2}
                  maxLength={50}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  defaultValue={editingConductor?.email} 
                  required 
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono *</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  defaultValue={editingConductor?.phone} 
                  required 
                  pattern="^\+?[1-9]\d{1,14}$"
                  placeholder="+54 11 1234-5678"
                />
              </div>
              <div>
                <Label htmlFor="licenseNumber">Número de Licencia *</Label>
                <Input 
                  id="licenseNumber" 
                  name="licenseNumber" 
                  defaultValue={editingConductor?.licenseNumber} 
                  required 
                  minLength={5}
                  maxLength={20}
                />
              </div>
              <div>
                <Label htmlFor="licenseType">Tipo de Licencia *</Label>
                <select 
                  id="licenseType" 
                  name="licenseType" 
                  defaultValue={editingConductor?.licenseType || 'B'} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="A">A - Motos</option>
                  <option value="B">B - Autos</option>
                  <option value="C">C - Camiones</option>
                  <option value="D">D - Transporte de Pasajeros</option>
                </select>
              </div>
              {editingConductor && (
                <div>
                  <Label htmlFor="status">Estado *</Label>
                  <select 
                    id="status" 
                    name="status" 
                    defaultValue={editingConductor?.status || 'ACTIVE'} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                </div>
              )}
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




