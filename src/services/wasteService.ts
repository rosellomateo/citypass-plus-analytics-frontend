// src/services/wasteService.ts
import type { DashboardFilters, WasteMetrics, ContainerStatus, WasteInputJson } from '../types';
import rawWasteJson from '../../testingDatos/waste_records.json';
import { adaptWasteInput } from '../adapters/wasteAdapter';
import { delay } from '../utils';
import { isWithinDateRange } from '../utils/dates';

/**
 * Servicio Analítico del Dominio de Residuos
 * Responsabilidades:
 * - Obtener datos JSON de entrada desde testingDatos/waste_records.json.
 * - Invocar el adaptador para obtener modelos internos normalizados.
 * - Aplicar DashboardFilters (zona, tipo de residuo, búsqueda, rango temporal).
 * - Calcular los 4 KPIs principales.
 * - Realizar agregaciones y estadísticas (gráficos).
 * - Ordenar el detalle de puntos críticos descendentemente por nivel de llenado.
 * - Devolver el contrato WasteMetrics.
 */
export async function getWasteAnalyticsData(filters: DashboardFilters): Promise<WasteMetrics> {
  await delay();

  // 1. Adaptar el JSON crudo entrante
  const normalizedRecords = adaptWasteInput(rawWasteJson as WasteInputJson);

  // 2. Aplicar filtros
  let filtered = [...normalizedRecords];

  if (filters.dateRange) {
    filtered = filtered.filter((r) => isWithinDateRange(r.timestamp, filters));
  }

  if (filters.zone && filters.zone !== 'all') {
    filtered = filtered.filter((r) => r.zone.toLowerCase() === filters.zone!.toLowerCase());
  }

  const selectedType = filters.wasteType || filters.category;
  if (selectedType && selectedType !== 'all') {
    filtered = filtered.filter((r) => r.wasteType.toLowerCase() === selectedType.toLowerCase());
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.containerId.toLowerCase().includes(q) ||
        r.zone.toLowerCase().includes(q) ||
        r.wasteType.toLowerCase().includes(q)
    );
  }

  // 3. KPI 1: Total Residuos Recolectados (totalCollectedTons)
  const totalTonsRaw = filtered.reduce((acc, r) => acc + r.collectedTons, 0);
  const totalCollectedTons = Number(totalTonsRaw.toFixed(1));

  // 4. KPI 2: Contenedores Críticos (criticalContainersCount) -> >80% (CRÍTICO + DESBORDADO)
  const criticalRecords = filtered.filter((r) => r.status === 'CRÍTICO' || r.status === 'DESBORDADO');
  const criticalContainersCount = criticalRecords.length;

  // 5. KPI 3: Tasa de Recolección a Tiempo (onTimeCollectionRatePct)
  const totalCount = filtered.length;
  const onTimeCount = filtered.filter((r) => r.collectedOnTime).length;
  const onTimeCollectionRatePct =
    totalCount > 0 ? Number(((onTimeCount / totalCount) * 100).toFixed(1)) : 0;

  // 6. KPI 4: Tiempo Promedio de Vaciado (avgCollectionTimeHours)
  const sumCollectionHours = filtered.reduce((acc, r) => acc + r.collectionTimeHours, 0);
  const avgCollectionTimeHours =
    totalCount > 0 ? Number((sumCollectionHours / totalCount).toFixed(1)) : 0;

  // 7. Gráfico 1: Estado de Llenado de Contenedores (containersByStatus - PieChart)
  const statusOrder: ContainerStatus[] = ['NORMAL', 'MEDIO', 'CRÍTICO', 'DESBORDADO'];
  const statusMap: Record<ContainerStatus, number> = {
    NORMAL: 0,
    MEDIO: 0,
    CRÍTICO: 0,
    DESBORDADO: 0,
  };

  filtered.forEach((r) => {
    if (statusMap[r.status] !== undefined) {
      statusMap[r.status] += 1;
    }
  });

  const containersByStatus = statusOrder.map((st) => ({
    status: st,
    count: statusMap[st],
  }));

  // 8. Gráfico 2: Volumen Recolectado por Tipo de Residuo (volumeByWasteType - BarChart)
  const wasteTypes = ['Orgánico', 'Reciclable', 'Peligroso', 'Voluminoso'];
  const volumeMap: Record<string, number> = {
    Orgánico: 0,
    Reciclable: 0,
    Peligroso: 0,
    Voluminoso: 0,
  };

  filtered.forEach((r) => {
    if (volumeMap[r.wasteType] !== undefined) {
      volumeMap[r.wasteType] += r.collectedTons;
    } else {
      volumeMap[r.wasteType] = r.collectedTons;
    }
  });

  // Asegurar la presencia de los 4 tipos documentados
  wasteTypes.forEach((wt) => {
    if (volumeMap[wt] === undefined) volumeMap[wt] = 0;
  });

  const volumeByWasteType = Object.entries(volumeMap).map(([wasteType, tons]) => ({
    wasteType,
    tons: Number(tons.toFixed(1)),
  }));

  // 9. Gráfico 3: Tiempo Promedio de Vaciado por Zona (avgCollectionTimeByZone - BarChart)
  const zoneHoursMap: Record<string, { totalHours: number; count: number }> = {};

  filtered.forEach((r) => {
    if (!zoneHoursMap[r.zone]) {
      zoneHoursMap[r.zone] = { totalHours: 0, count: 0 };
    }
    zoneHoursMap[r.zone].totalHours += r.collectionTimeHours;
    zoneHoursMap[r.zone].count += 1;
  });

  const avgCollectionTimeByZone = Object.entries(zoneHoursMap).map(([zone, data]) => ({
    zone,
    hours: data.count > 0 ? Number((data.totalHours / data.count).toFixed(1)) : 0,
  }));

  // 10. Tabla 1: Puntos Críticos de Atenciones Pendientes (criticalContainersDetail - DataTable)
  // Ordenado descendentemente por fillLevelPct
  const criticalContainersDetail = criticalRecords
    .map((r) => ({
      containerId: r.containerId,
      zone: r.zone,
      wasteType: r.wasteType,
      fillLevelPct: r.fillLevelPct,
      hoursOverfilled: Number(r.hoursOverfilled.toFixed(1)),
    }))
    .sort((a, b) => b.fillLevelPct - a.fillLevelPct);

  return {
    totalCollectedTons,
    criticalContainersCount,
    onTimeCollectionRatePct,
    avgCollectionTimeHours,
    containersByStatus,
    volumeByWasteType,
    avgCollectionTimeByZone,
    criticalContainersDetail,
  };
}
