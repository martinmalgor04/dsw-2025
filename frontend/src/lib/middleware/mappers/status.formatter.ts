export const translateShipmentStatus = (status: string): string => {
  const map: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmado',
    IN_TRANSIT: 'En tránsito',
    DELIVERED: 'Entregado',
    FAILED: 'Fallido',
    CANCELLED: 'Cancelado',
  };
  return map[status] ?? status;
};

export const getStatusBadgeColor = (status: string): string => {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    IN_TRANSIT: 'bg-cyan-100 text-cyan-800',
    DELIVERED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-800';
};
