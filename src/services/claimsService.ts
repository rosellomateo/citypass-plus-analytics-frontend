// src/services/claimsService.ts
import type { DashboardFilters, ClaimsAnalyticsData, BackendAnalyticsRecord, AIAnalysisReport } from '../types';
import { mockClaimRecords, mockClaimsAIReport } from '../data/mocks/claims.mock';
import { delay } from '../utils';
import { isWithinDateRange } from '../utils/dates';

export function formatClaimCategory(category: string): string {
  if (!category) return 'OTROS';
  return category.replace(/_/g, ' ').toUpperCase();
}

export function mapClaimStatus(status: string): string {
  if (!status) return 'CREADO';
  const s = status.toUpperCase().trim();
  if (s === 'ASIGNADO' || s === 'EN_CURSO' || s === 'EN CURSO') return 'EN CURSO';
  if (s === 'RECHAZADO' || s === 'CANCELADO') return 'CANCELADO';
  if (s === 'CERRADO' || s === 'RESUELTA') return 'CERRADO';
  return 'CREADO';
}

export function getFilteredClaimRecords(
  filters: DashboardFilters,
  records: BackendAnalyticsRecord[] = mockClaimRecords
): BackendAnalyticsRecord[] {
  let filtered = records.filter((r) => isWithinDateRange(r.fecha_snapshot, filters));

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.categoria.toLowerCase().includes(q) ||
        r.barrio.toLowerCase().includes(q) ||
        r.prioridad.toLowerCase().includes(q) ||
        r.estado_actual.toLowerCase().includes(q) ||
        r.origenClasificacion.toLowerCase().includes(q)
    );
  }

  return filtered;
}

export function getClaimsByStatusFiltered(
  records: BackendAnalyticsRecord[],
  categoryFilter?: string
): { status: string; count: number }[] {
  const filtered =
    !categoryFilter || categoryFilter === 'ALL' || categoryFilter === 'Todas las categorías'
      ? records
      : records.filter((r) => formatClaimCategory(r.categoria) === categoryFilter);

  const statusCounts: Record<string, number> = {
    CREADO: 0,
    'EN CURSO': 0,
    CERRADO: 0,
    CANCELADO: 0,
  };

  filtered.forEach((r) => {
    const mapped = mapClaimStatus(r.estado_actual);
    if (statusCounts[mapped] !== undefined) {
      statusCounts[mapped] += r.row_count ?? 1;
    }
  });

  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));
}

export function getClaimsByCategoryFiltered(
  records: BackendAnalyticsRecord[],
  statusPillFilter?: string
): { category: string; count: number }[] {
  const categoriesSet = new Set<string>();
  records.forEach((r) => categoriesSet.add(formatClaimCategory(r.categoria)));

  const categoryCounts: Record<string, number> = {};
  categoriesSet.forEach((cat) => {
    categoryCounts[cat] = 0;
  });

  records.forEach((r) => {
    const mappedStatus = mapClaimStatus(r.estado_actual);
    // Canceled / Rejected claims are excluded from category breakdown unless specifically selected
    if (mappedStatus === 'CANCELADO' && (!statusPillFilter || statusPillFilter === 'Todos' || statusPillFilter === 'ALL')) {
      return;
    }

    if (
      statusPillFilter &&
      statusPillFilter !== 'ALL' &&
      statusPillFilter !== 'Todos' &&
      mappedStatus.toLowerCase() !== statusPillFilter.toLowerCase() &&
      r.estado_actual.toLowerCase() !== statusPillFilter.toLowerCase()
    ) {
      return;
    }

    const catName = formatClaimCategory(r.categoria);
    categoryCounts[catName] = (categoryCounts[catName] || 0) + (r.row_count ?? 1);
  });

  return Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count,
  }));
}

export async function getClaimsAnalyticsData(
  filters: DashboardFilters,
  records: BackendAnalyticsRecord[] = mockClaimRecords
): Promise<ClaimsAnalyticsData> {
  await delay();

  const filtered = getFilteredClaimRecords(filters, records);

  const availableCategories = Array.from(
    new Set(filtered.map((r) => formatClaimCategory(r.categoria)))
  ).sort();

  const claimsByCategory = getClaimsByCategoryFiltered(filtered, 'Todos');
  const claimsByStatus = getClaimsByStatusFiltered(filtered, 'ALL');

  const totalClaims = filtered.reduce((acc, r) => acc + (r.row_count ?? 1), 0);

  // Time to resolution: weighted average of tiempo_prom_hasta_estado_actual
  const closedRecords = filtered.filter((r) => {
    const st = mapClaimStatus(r.estado_actual);
    return st === 'CERRADO' || r.estado_actual === 'CERRADO' || r.estado_actual === 'ASIGNADO';
  });

  const totalWeightedResolutionTime = closedRecords.reduce(
    (acc, r) => acc + r.tiempo_prom_hasta_estado_actual * (r.row_count ?? 1),
    0
  );
  const totalClosedCount = closedRecords.reduce((acc, r) => acc + (r.row_count ?? 1), 0);

  const avgResolutionTimeHours =
    totalClosedCount > 0 ? Number((totalWeightedResolutionTime / totalClosedCount).toFixed(1)) : 0;

  // Average resolution by category
  const resolutionByCategoryMap: Record<string, { totalTime: number; count: number }> = {};

  filtered.forEach((r) => {
    const cat = formatClaimCategory(r.categoria);
    if (!resolutionByCategoryMap[cat]) {
      resolutionByCategoryMap[cat] = { totalTime: 0, count: 0 };
    }
    const weight = r.row_count ?? 1;
    resolutionByCategoryMap[cat].totalTime += r.tiempo_prom_hasta_estado_actual * weight;
    resolutionByCategoryMap[cat].count += weight;
  });

  const avgResolutionByCategory = Object.entries(resolutionByCategoryMap).map(([category, data]) => ({
    category,
    hours: data.count > 0 ? Number((data.totalTime / data.count).toFixed(1)) : 0,
  }));

  return {
    totalClaims,
    claimsByCategory,
    claimsByStatus,
    avgResolutionTimeHours,
    avgResolutionByCategory,
    availableCategories,
    aiReport: mockClaimsAIReport as unknown as AIAnalysisReport,
  };
}
