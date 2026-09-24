// src/services/emergencyService.ts
import type {
  DashboardFilters,
  EmergencyAnalyticsData,
  EmergencyState,
  EmergencyPriority,
  CategoryPriorityStackedData,
} from '../types';
import {
  mockEmergenciaCreadaEvents,
  mockEmergenciaPriorizadaEvents,
  mockEmergenciaEstadoActualizadoEvents,
  mockEmergenciaDespachadaEvents,
  mockEmergenciesAIReport,
} from '../data/mocks/emergencies.mock';
import { delay } from '../utils';
import { isWithinDateRange } from '../utils/dates';

export interface LocalEmergencyFilters {
  categoryAvgDispatch?: string;
  categoryPriorityDist?: string;
  statePill?: string;
}

function matchesStatePill(state: EmergencyState | string, pill: string): boolean {
  if (!pill || pill === 'ALL' || pill === 'Todos') return true;
  const normalizedPill = pill.trim().toLowerCase();
  const normalizedState = state.trim().toLowerCase();

  switch (normalizedPill) {
    case 'recibido':
      return normalizedState === 'recibido' || normalizedState === 'pendiente';
    case 'en revisión':
    case 'en revision':
      return normalizedState === 'en_revision' || normalizedState === 'validada';
    case 'asignado':
      return normalizedState === 'asignado';
    case 'en proceso':
      return (
        normalizedState === 'en_proceso' ||
        normalizedState === 'despachada' ||
        normalizedState === 'en_camino' ||
        normalizedState === 'en_lugar'
      );
    case 'cerrado':
      return (
        normalizedState === 'cerrado' ||
        normalizedState === 'cerrada' ||
        normalizedState === 'resuelta'
      );
    case 'rechazado':
      return normalizedState === 'rechazado' || normalizedState === 'descartada';
    default:
      return normalizedState === normalizedPill;
  }
}

export function getCategoryPriorityDistribution(
  createdEvents: typeof mockEmergenciaCreadaEvents,
  priorityMap: Map<string, EmergencyPriority>,
  currentStateMap: Map<string, EmergencyState>,
  statePillFilter?: string,
  categoryFilter?: string
): CategoryPriorityStackedData[] {
  const categoryMap = new Map<string, { BAJA: number; MEDIA: number; ALTA: number; CRITICA: number }>();

  createdEvents.forEach((evt) => {
    const catName = evt.data.categoria || evt.data.tipo || 'Otras';
    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, { BAJA: 0, MEDIA: 0, ALTA: 0, CRITICA: 0 });
    }
  });

  createdEvents.forEach((evt) => {
    const catName = evt.data.categoria || evt.data.tipo || 'Otras';
    if (
      categoryFilter &&
      categoryFilter !== 'ALL' &&
      categoryFilter !== 'Todas las categorías' &&
      catName !== categoryFilter
    ) {
      return;
    }

    const currentState = currentStateMap.get(evt.data.emergenciaId) || evt.data.estado;
    if (statePillFilter && !matchesStatePill(currentState, statePillFilter)) {
      return;
    }

    const priority = priorityMap.get(evt.data.emergenciaId) || 'BAJA';
    const currentCounts = categoryMap.get(catName)!;
    if (currentCounts) {
      currentCounts[priority] = (currentCounts[priority] || 0) + 1;
    }
  });

  const result: CategoryPriorityStackedData[] = [];
  categoryMap.forEach((counts, category) => {
    if (
      categoryFilter &&
      categoryFilter !== 'ALL' &&
      categoryFilter !== 'Todas las categorías' &&
      category !== categoryFilter
    ) {
      return;
    }

    const total = counts.BAJA + counts.MEDIA + counts.ALTA + counts.CRITICA;
    result.push({
      category,
      BAJA: counts.BAJA,
      MEDIA: counts.MEDIA,
      ALTA: counts.ALTA,
      CRITICA: counts.CRITICA,
      total,
    });
  });

  return result.sort((a, b) => b.total - a.total);
}

export function getPriorityDistribution(
  createdEvents: typeof mockEmergenciaCreadaEvents,
  priorityMap: Map<string, EmergencyPriority>,
  categoryFilter?: string
): { priority: string; count: number }[] {
  const filteredEvents =
    !categoryFilter || categoryFilter === 'ALL' || categoryFilter === 'Todas las categorías'
      ? createdEvents
      : createdEvents.filter((e) => (e.data.categoria || e.data.tipo) === categoryFilter);

  const priorityCounts: Record<string, number> = {
    CRITICA: 0,
    ALTA: 0,
    MEDIA: 0,
    BAJA: 0,
  };

  filteredEvents.forEach((e) => {
    const prio = priorityMap.get(e.data.emergenciaId) || 'BAJA';
    priorityCounts[prio] = (priorityCounts[prio] || 0) + 1;
  });

  return Object.entries(priorityCounts).map(([priority, count]) => ({ priority, count }));
}

export function getAvgDispatchTimeByPriority(
  createdMap: Map<string, typeof mockEmergenciaCreadaEvents[0]>,
  priorityMap: Map<string, EmergencyPriority>,
  categoryFilter?: string
): { priority: string; minutes: number }[] {
  const dispatchTimesByPriority: Record<string, number[]> = {
    CRITICA: [],
    ALTA: [],
    MEDIA: [],
    BAJA: [],
  };

  mockEmergenciaDespachadaEvents.forEach((d) => {
    const cEvt = createdMap.get(d.data.emergenciaId);
    if (cEvt) {
      const category = cEvt.data.categoria || cEvt.data.tipo;
      if (
        categoryFilter &&
        categoryFilter !== 'ALL' &&
        categoryFilter !== 'Todas las categorías' &&
        category !== categoryFilter
      ) {
        return;
      }

      const createdTime = new Date(cEvt.metadata.occurredAt).getTime();
      const dispatchedTime = new Date(d.metadata.occurredAt).getTime();
      const diffMin = Math.max(0, (dispatchedTime - createdTime) / 60000);

      const prio = priorityMap.get(d.data.emergenciaId) || 'BAJA';
      if (!dispatchTimesByPriority[prio]) dispatchTimesByPriority[prio] = [];
      dispatchTimesByPriority[prio].push(diffMin);
    }
  });

  return Object.entries(dispatchTimesByPriority).map(([priority, times]) => ({
    priority,
    minutes: times.length > 0 ? Number((times.reduce((a, b) => a + b, 0) / times.length).toFixed(1)) : 0,
  }));
}

export async function getEmergencyAnalyticsData(
  filters: DashboardFilters,
  localFilters?: LocalEmergencyFilters
): Promise<EmergencyAnalyticsData> {
  await delay();

  const created = mockEmergenciaCreadaEvents.filter((e) => isWithinDateRange(e.metadata.occurredAt, filters));
  const createdMap = new Map(created.map((e) => [e.data.emergenciaId, e]));

  // Priorities map
  const priorityMap = new Map<string, EmergencyPriority>();
  mockEmergenciaPriorizadaEvents.forEach((e) => priorityMap.set(e.data.emergenciaId, e.data.prioridad));

  // Current states map
  const currentStateMap = new Map<string, EmergencyState>();
  created.forEach((e) => currentStateMap.set(e.data.emergenciaId, e.data.estado));

  // State updates
  const stateUpdatesSorted = [...mockEmergenciaEstadoActualizadoEvents].sort(
    (a, b) => new Date(a.metadata.occurredAt).getTime() - new Date(b.metadata.occurredAt).getTime()
  );
  stateUpdatesSorted.forEach((u) => currentStateMap.set(u.data.emergenciaId, u.data.estadoNuevo));

  // CU-E1: Total, active vs closed, state counts
  let activeCount = 0;
  let closedCount = 0;
  const stateCounts: Record<string, number> = {};

  currentStateMap.forEach((st) => {
    stateCounts[st] = (stateCounts[st] || 0) + 1;
    const lowerSt = st.toLowerCase();
    if (lowerSt === 'cerrada' || lowerSt === 'cerrado' || lowerSt === 'resuelta' || lowerSt === 'descartada' || lowerSt === 'rechazado') {
      closedCount += 1;
    } else {
      activeCount += 1;
    }
  });

  const emergenciesByState = Object.entries(stateCounts).map(([state, count]) => ({ state, count }));
  const emergenciesByPriority = getPriorityDistribution(created, priorityMap, localFilters?.categoryPriorityDist);
  const avgDispatchTimeByPriority = getAvgDispatchTimeByPriority(createdMap, priorityMap, localFilters?.categoryAvgDispatch);

  // Global avg dispatch time
  const globalTimes: number[] = [];
  mockEmergenciaDespachadaEvents.forEach((d) => {
    const cEvt = createdMap.get(d.data.emergenciaId);
    if (cEvt) {
      const diffMin = Math.max(0, (new Date(d.metadata.occurredAt).getTime() - new Date(cEvt.metadata.occurredAt).getTime()) / 60000);
      globalTimes.push(diffMin);
    }
  });
  const avgDispatchTimeMinutes =
    globalTimes.length > 0
      ? Number((globalTimes.reduce((a, b) => a + b, 0) / globalTimes.length).toFixed(1))
      : 0;

  // Emergencies by Category Stacked by Priority
  const emergenciesByCategoryStacked = getCategoryPriorityDistribution(
    created,
    priorityMap,
    currentStateMap,
    localFilters?.statePill
  );

  // Available unique categories
  const categoriesSet = new Set<string>();
  created.forEach((e) => {
    const cat = e.data.categoria || e.data.tipo;
    if (cat) categoriesSet.add(cat);
  });
  const availableCategories = Array.from(categoriesSet).sort();

  return {
    totalEmergencies: created.length,
    activeCount,
    closedCount,
    emergenciesByState,
    emergenciesByPriority,
    avgDispatchTimeMinutes,
    avgDispatchTimeByPriority,
    emergenciesByCategoryStacked,
    availableCategories,
    aiReport: mockEmergenciesAIReport,
  };
}
