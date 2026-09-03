// src/services/claimsService.ts
import type { DashboardFilters, ClaimsAnalyticsData, ClaimStatus } from '../types';
import { mockClaimCreatedEvents, mockClaimUpdatedEvents } from '../data/mocks/claims.mock';
import { delay } from '../utils';
import { isWithinDateRange } from '../utils/dates';

export async function getClaimsAnalyticsData(filters: DashboardFilters): Promise<ClaimsAnalyticsData> {
  await delay();

  // Filter created events
  let created = mockClaimCreatedEvents.filter((e) => isWithinDateRange(e.metadata.occurredAt, filters));
  if (filters.search) {
    const q = filters.search.toLowerCase();
    created = created.filter(
      (e) =>
        e.data.categoria.toLowerCase().includes(q) ||
        e.data.zona.toLowerCase().includes(q) ||
        e.data.reclamoId.toLowerCase().includes(q)
    );
  }

  const createdMap = new Map(created.map((e) => [e.data.reclamoId, e]));

  // Calculate current status of each claim
  const currentStatusMap = new Map<string, ClaimStatus>();
  created.forEach((e) => currentStatusMap.set(e.data.reclamoId, e.data.estado));

  // Sort updates by occurredAt ascending to trace status progression
  const updatesSorted = [...mockClaimUpdatedEvents].sort(
    (a, b) => new Date(a.metadata.occurredAt).getTime() - new Date(b.metadata.occurredAt).getTime()
  );

  updatesSorted.forEach((u) => {
    if (currentStatusMap.has(u.data.reclamoId)) {
      currentStatusMap.set(u.data.reclamoId, u.data.estadoNuevo);
    }
  });

  // CU-R1: Total claims & distribution by category & current status
  const categoryCounts: Record<string, number> = {};
  created.forEach((e) => {
    const cat = e.data.categoria;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const claimsByCategory = Object.entries(categoryCounts).map(([category, count]) => ({
    category: category.replace('_', ' ').toUpperCase(),
    count,
  }));

  const statusCounts: Record<string, number> = {
    creado: 0,
    'en curso': 0,
    cerrado: 0,
    cancelado: 0,
  };

  currentStatusMap.forEach((status) => {
    if (statusCounts[status] !== undefined) {
      statusCounts[status] += 1;
    }
  });

  const claimsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
    status: status.toUpperCase(),
    count,
  }));

  // CU-R2: Time to resolution (occurredAt cerrado - occurredAt creado)
  // Find closed events
  const closedEvents = mockClaimUpdatedEvents.filter((u) => u.data.estadoNuevo === 'cerrado');
  const resolutionTimesHours: number[] = [];
  const resolutionByCategoryHours: Record<string, number[]> = {};

  closedEvents.forEach((u) => {
    const createdEvt = createdMap.get(u.data.reclamoId);
    if (createdEvt) {
      const createdTime = new Date(createdEvt.metadata.occurredAt).getTime();
      const closedTime = new Date(u.metadata.occurredAt).getTime();
      const diffHours = Math.max(0, (closedTime - createdTime) / 3600000);

      resolutionTimesHours.push(diffHours);
      const cat = createdEvt.data.categoria.replace('_', ' ').toUpperCase();
      if (!resolutionByCategoryHours[cat]) {
        resolutionByCategoryHours[cat] = [];
      }
      resolutionByCategoryHours[cat].push(diffHours);
    }
  });

  const avgResolutionTimeHours =
    resolutionTimesHours.length > 0
      ? Number((resolutionTimesHours.reduce((a, b) => a + b, 0) / resolutionTimesHours.length).toFixed(1))
      : 0;

  const avgResolutionByCategory = Object.entries(resolutionByCategoryHours).map(([category, times]) => ({
    category,
    hours: Number((times.reduce((a, b) => a + b, 0) / times.length).toFixed(1)),
  }));

  return {
    totalClaims: created.length,
    claimsByCategory,
    claimsByStatus,
    avgResolutionTimeHours,
    avgResolutionByCategory,
  };
}
