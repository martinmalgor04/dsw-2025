import { PublicTrackingDTO, TrackingEvent } from './shipment.service';

const TRACKING_STATUSES = [
  'PENDING',
  'PROCESSING',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED'
];

const CITIES = [
  { city: 'Bogotá', state: 'Cundinamarca', postalCode: '110111' },
  { city: 'Medellín', state: 'Antioquia', postalCode: '050001' },
  { city: 'Cali', state: 'Valle del Cauca', postalCode: '760001' },
  { city: 'Barranquilla', state: 'Atlántico', postalCode: '080001' },
  { city: 'Cartagena', state: 'Bolívar', postalCode: '130001' }
];

const TRANSPORT_METHODS = [
  'Terrestre Express',
  'Terrestre Estándar',
  'Aéreo',
  'Marítimo'
];

function generateTrackingEvents(status: string): TrackingEvent[] {
  const now = new Date();
  const events: TrackingEvent[] = [];

  // Pedido creado (siempre existe)
  events.push({
    status: 'PENDING',
    description: 'Pedido recibido y en procesamiento',
    timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Centro de Distribución - Bogotá'
  });

  // Procesamiento
  if (TRACKING_STATUSES.indexOf(status) >= TRACKING_STATUSES.indexOf('PROCESSING')) {
    events.push({
      status: 'PROCESSING',
      description: 'Paquete preparado para envío',
      timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Centro de Distribución - Bogotá'
    });
  }

  // En tránsito
  if (TRACKING_STATUSES.indexOf(status) >= TRACKING_STATUSES.indexOf('IN_TRANSIT')) {
    events.push({
      status: 'IN_TRANSIT',
      description: 'En camino al destino',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'En ruta'
    });
  }

  // Fuera para entrega
  if (TRACKING_STATUSES.indexOf(status) >= TRACKING_STATUSES.indexOf('OUT_FOR_DELIVERY')) {
    events.push({
      status: 'OUT_FOR_DELIVERY',
      description: 'Paquete en reparto, será entregado hoy',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Centro de Distribución Local'
    });
  }

  // Entregado
  if (status === 'DELIVERED') {
    events.push({
      status: 'DELIVERED',
      description: 'Entregado exitosamente',
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      location: 'Destino final'
    });
  }

  // Cancelado
  if (status === 'CANCELLED') {
    events.push({
      status: 'CANCELLED',
      description: 'Envío cancelado por solicitud del cliente',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Centro de Distribución'
    });
  }

  return events.reverse(); // Más reciente primero
}

function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    PENDING: 'Pendiente de procesamiento',
    PROCESSING: 'En preparación',
    IN_TRANSIT: 'En tránsito',
    OUT_FOR_DELIVERY: 'Fuera para entrega',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado'
  };
  return descriptions[status] || 'Estado desconocido';
}

export function generateMockTrackingData(id: string): PublicTrackingDTO {
  // Generar un estado aleatorio pero consistente con el ID
  const statusIndex = parseInt(id.slice(-1), 16) % TRACKING_STATUSES.length;
  const status = TRACKING_STATUSES[statusIndex];

  const cityIndex = parseInt(id.slice(-2), 16) % CITIES.length;
  const destination = CITIES[cityIndex];

  const transportIndex = parseInt(id.slice(-3, -2), 16) % TRANSPORT_METHODS.length;
  const transportMethod = TRANSPORT_METHODS[transportIndex];

  const now = new Date();
  const estimatedDelivery = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  return {
    id,
    trackingNumber: `TRK${id.slice(0, 8).toUpperCase()}`,
    status,
    statusDescription: getStatusDescription(status),
    currentLocation: status === 'IN_TRANSIT' ? 'En ruta' : destination.city,
    estimatedDeliveryDate: status === 'DELIVERED' ? undefined : estimatedDelivery.toISOString(),
    actualDeliveryDate: status === 'DELIVERED' ? new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString() : undefined,
    destinationAddress: destination,
    transportMethod,
    events: generateTrackingEvents(status),
    labelUrl: `/api/labels/${id}.pdf`
  };
}

export async function getMockTracking(id: string, delay = 800): Promise<PublicTrackingDTO> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simular 404 para ciertos IDs
      if (id === 'notfound' || id === '000') {
        reject(new Error('Envío no encontrado'));
      } else {
        resolve(generateMockTrackingData(id));
      }
    }, delay);
  });
}
