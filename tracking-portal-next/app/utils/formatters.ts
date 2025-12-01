import { ShippingStatus } from '../types/shipment';

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatCurrency = (amount: number, currency: string = 'ARS'): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const getStatusLabel = (status: ShippingStatus): string => {
  const statusLabels: Record<ShippingStatus, string> = {
    created: 'Creado',
    reserved: 'Reservado',
    in_transit: 'En tránsito',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    in_distribution: 'En distribución',
    arrived: 'Llegado'
  };
  return statusLabels[status] || status;
};

export const getStatusColor = (status: ShippingStatus): string => {
  const statusColors: Record<ShippingStatus, string> = {
    created: 'bg-slate-100 text-slate-700 border-slate-200',
    reserved: 'bg-blue-100 text-blue-700 border-blue-200',
    in_transit: 'bg-blue-100 text-blue-700 border-blue-200',
    delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    in_distribution: 'bg-amber-100 text-amber-700 border-amber-200',
    arrived: 'bg-amber-100 text-amber-700 border-amber-200'
  };
  return statusColors[status] || 'bg-slate-100 text-slate-700 border-slate-200';
};

export const getTransportTypeLabel = (type: string): string => {
  const typeLabels: Record<string, string> = {
    air: 'Aéreo',
    sea: 'Marítimo',
    rail: 'Ferrocarril',
    road: 'Terrestre'
  };
  return typeLabels[type] || type;
};

