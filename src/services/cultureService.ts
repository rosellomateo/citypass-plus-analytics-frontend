// src/services/cultureService.ts
import type { DashboardFilters, CultureAnalyticsData } from '../types';
import {
  mockReservaConfirmadaEvents,
  mockReservaCanceladaEvents,
  mockEventoPublicadoEvents,
  mockInscripcionConfirmadaEvents,
  mockInscripcionCanceladaEvents,
} from '../data/mocks/culture.mock';
import { delay } from '../utils';

export async function getCultureAnalyticsData(_filters: DashboardFilters): Promise<CultureAnalyticsData> {
  await delay();

  // CU-C1: Public Space Occupation
  const confirmedReservations = mockReservaConfirmadaEvents.length;
  const cancelledReservations = mockReservaCanceladaEvents.length;
  const totalReservations = confirmedReservations + cancelledReservations;
  const cancellationRatePct =
    totalReservations > 0 ? Number(((cancelledReservations / totalReservations) * 100).toFixed(1)) : 0;

  const spaceMap: Record<string, { confirmed: number; cancelled: number }> = {};

  mockReservaConfirmadaEvents.forEach((r) => {
    const sp = r.data.espacioId;
    if (!spaceMap[sp]) spaceMap[sp] = { confirmed: 0, cancelled: 0 };
    spaceMap[sp].confirmed += 1;
  });

  mockReservaCanceladaEvents.forEach((r) => {
    const sp = r.data.espacioId;
    if (!spaceMap[sp]) spaceMap[sp] = { confirmed: 0, cancelled: 0 };
    spaceMap[sp].cancelled += 1;
  });

  const reservationsBySpace = Object.entries(spaceMap).map(([space, counts]) => ({
    space,
    confirmed: counts.confirmed,
    cancelled: counts.cancelled,
  }));

  // CU-C2: Community Event Turnout
  const activeInscriptions = mockInscripcionConfirmadaEvents.length - mockInscripcionCanceladaEvents.length;

  const eventMap = new Map(mockEventoPublicadoEvents.map((e) => [e.data.eventoId, e.data]));
  const inscriptionsPerEvent: Record<string, number> = {};

  mockInscripcionConfirmadaEvents.forEach((i) => {
    const evtId = i.data.eventoId;
    inscriptionsPerEvent[evtId] = (inscriptionsPerEvent[evtId] || 0) + 1;
  });

  mockInscripcionCanceladaEvents.forEach((i) => {
    const evtId = i.data.eventoId;
    if (inscriptionsPerEvent[evtId]) {
      inscriptionsPerEvent[evtId] -= 1;
    }
  });

  const inscriptionsByEvent = mockEventoPublicadoEvents.map((e) => {
    const reg = inscriptionsPerEvent[e.data.eventoId] || 0;
    const cap = e.data.cupoMaximo;
    const occupancyPct = cap > 0 ? Number(((reg / cap) * 100).toFixed(1)) : 0;

    return {
      eventTitle: e.data.titulo,
      registered: reg,
      capacity: cap,
      occupancyPct,
    };
  });

  const categoryCounts: Record<string, number> = {};
  mockEventoPublicadoEvents.forEach((e) => {
    const cat = e.data.categoria;
    const count = inscriptionsPerEvent[e.data.eventoId] || 0;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + count;
  });

  const inscriptionsByCategory = Object.entries(categoryCounts).map(([category, count]) => ({
    category: category.toUpperCase(),
    count,
  }));

  const avgOccupancyRatePct =
    inscriptionsByEvent.length > 0
      ? Number(
          (
            inscriptionsByEvent.reduce((a, b) => a + b.occupancyPct, 0) / inscriptionsByEvent.length
          ).toFixed(1)
        )
      : 0;

  return {
    confirmedReservations,
    cancelledReservations,
    cancellationRatePct,
    reservationsBySpace,
    totalInscriptions: Math.max(0, activeInscriptions),
    inscriptionsByEvent,
    inscriptionsByCategory,
    avgOccupancyRatePct,
  };
}
