import { KPIData } from './report.service';

/**
 * Generates mock KPI data for development/testing
 * This can be used when the backend is not available or for demos
 */
export function generateMockKPIData(): KPIData {
  // Generate timeline data for the last 30 days
  const timelineData = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

    const shipments = Math.floor(Math.random() * 50) + 30;
    const delivered = Math.floor(shipments * (0.7 + Math.random() * 0.25));
    const cancelled = Math.floor(shipments * Math.random() * 0.1);

    timelineData.push({
      date: dateStr,
      shipments,
      delivered,
      cancelled,
    });
  }

  // Calculate totals from timeline
  const totalMonth = timelineData.reduce((sum, day) => sum + day.shipments, 0);
  const totalWeek = timelineData.slice(-7).reduce((sum, day) => sum + day.shipments, 0);
  const totalToday = timelineData[timelineData.length - 1].shipments;

  // Status distribution
  const statusData = [
    { status: 'Entregado', count: Math.floor(totalMonth * 0.65), percentage: 65 },
    { status: 'En tránsito', count: Math.floor(totalMonth * 0.20), percentage: 20 },
    { status: 'Pendiente', count: Math.floor(totalMonth * 0.10), percentage: 10 },
    { status: 'Cancelado', count: Math.floor(totalMonth * 0.05), percentage: 5 },
  ];

  // Transport type distribution
  const transportTypes = [
    { type: 'Terrestre Express', count: Math.floor(totalMonth * 0.40), percentage: 40 },
    { type: 'Terrestre Estándar', count: Math.floor(totalMonth * 0.30), percentage: 30 },
    { type: 'Aéreo', count: Math.floor(totalMonth * 0.20), percentage: 20 },
    { type: 'Marítimo', count: Math.floor(totalMonth * 0.10), percentage: 10 },
  ];

  // Top zones
  const topZones = [
    { zone: 'Bogotá Centro', shipments: Math.floor(totalMonth * 0.25) },
    { zone: 'Medellín Norte', shipments: Math.floor(totalMonth * 0.20) },
    { zone: 'Cali Sur', shipments: Math.floor(totalMonth * 0.18) },
    { zone: 'Barranquilla Este', shipments: Math.floor(totalMonth * 0.15) },
    { zone: 'Cartagena', shipments: Math.floor(totalMonth * 0.12) },
  ];

  return {
    totalShipments: {
      today: totalToday,
      week: totalWeek,
      month: totalMonth,
    },
    deliverySuccessRate: 65 + Math.random() * 15, // 65-80%
    averageDeliveryTime: 24 + Math.random() * 24, // 24-48 hours
    shipmentsByStatus: statusData,
    timelineData,
    transportTypeDistribution: transportTypes,
    statusDistribution: statusData.map(({ status, count }) => ({ status, count })),
    topZones,
  };
}

/**
 * Simulates an API call with mock data
 * Use this to test the UI without a backend
 */
export async function getMockKPIs(delay = 1000): Promise<KPIData> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateMockKPIData());
    }, delay);
  });
}
