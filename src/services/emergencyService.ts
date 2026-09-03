// src/services/emergencyService.ts
import type { DashboardFilters, EmergencyAnalyticsData, EmergencyState, EmergencyPriority } from '../types';
import {
  mockEmergenciaCreadaEvents,
  mockEmergenciaPriorizadaEvents,
  mockEmergenciaEstadoActualizadoEvents,
  mockEmergenciaDespachadaEvents,
} from '../data/mocks/emergencies.mock';
import { delay } from '../utils';
import { isWithinDateRange } from '../utils/dates';

export async function getEmergencyAnalyticsData(filters: DashboardFilters): Promise<EmergencyAnalyticsData> {
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

  // CU-E1: Total, active vs closed, state counts, priority counts
  let activeCount = 0;
  let closedCount = 0;
  const stateCounts: Record<string, number> = {};
  const priorityCounts: Record<string, number> = { ALTA: 0, MEDIA: 0, BAJA: 0 };

  currentStateMap.forEach((st, id) => {
    stateCounts[st] = (stateCounts[st] || 0) + 1;
    if (st === 'CERRADA' || st === 'RESUELTA' || st === 'DESCARTADA') {
      closedCount += 1;
    } else {
      activeCount += 1;
    }

    const prio = priorityMap.get(id) || 'BAJA';
    priorityCounts[prio] = (priorityCounts[prio] || 0) + 1;
  });

  const emergenciesByState = Object.entries(stateCounts).map(([state, count]) => ({ state, count }));
  const emergenciesByPriority = Object.entries(priorityCounts).map(([priority, count]) => ({ priority, count }));

  // CU-E2: Dispatch time = occurredAt(EmergenciaDespachada) - occurredAt(EmergenciaCreada)
  const dispatchTimesMin: number[] = [];
  const dispatchTimesByPriority: Record<string, number[]> = { ALTA: [], MEDIA: [], BAJA: [] };

  mockEmergenciaDespachadaEvents.forEach((d) => {
    const cEvt = createdMap.get(d.data.emergenciaId);
    if (cEvt) {
      const createdTime = new Date(cEvt.metadata.occurredAt).getTime();
      const dispatchedTime = new Date(d.metadata.occurredAt).getTime();
      const diffMin = Math.max(0, (dispatchedTime - createdTime) / 60000);

      dispatchTimesMin.push(diffMin);

      const prio = priorityMap.get(d.data.emergenciaId) || 'BAJA';
      if (!dispatchTimesByPriority[prio]) dispatchTimesByPriority[prio] = [];
      dispatchTimesByPriority[prio].push(diffMin);
    }
  });

  const avgDispatchTimeMinutes =
    dispatchTimesMin.length > 0
      ? Number((dispatchTimesMin.reduce((a, b) => a + b, 0) / dispatchTimesMin.length).toFixed(1))
      : 0;

  const avgDispatchTimeByPriority = Object.entries(dispatchTimesByPriority).map(([priority, times]) => ({
    priority,
    minutes: times.length > 0 ? Number((times.reduce((a, b) => a + b, 0) / times.length).toFixed(1)) : 0,
  }));

  return {
    totalEmergencies: created.length,
    activeCount,
    closedCount,
    emergenciesByState,
    emergenciesByPriority,
    avgDispatchTimeMinutes,
    avgDispatchTimeByPriority,
  };
}
