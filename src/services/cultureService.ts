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
import { isWithinDateRange } from '../utils/dates';

export async function getCultureAnalyticsData(filters: DashboardFilters): Promise<CultureAnalyticsData> {
  await delay();

  const confirmedEvents = mockReservaConfirmadaEvents.filter((e) =>
    isWithinDateRange(e.metadata.occurredAt, filters)
  );
  const cancelledEvents = mockReservaCanceladaEvents.filter((e) =>
    isWithinDateRange(e.metadata.occurredAt, filters)
  );
  const publicadoEvents = mockEventoPublicadoEvents.filter((e) =>
    isWithinDateRange(e.metadata.occurredAt, filters)
  );
  const inscripcionConfirmadaEvents = mockInscripcionConfirmadaEvents.filter((e) =>
    isWithinDateRange(e.metadata.occurredAt, filters)
  );
  const inscripcionCanceladaEvents = mockInscripcionCanceladaEvents.filter((e) =>
    isWithinDateRange(e.metadata.occurredAt, filters)
  );

  // CU-C1: Public Space Occupation
  const confirmedReservations = confirmedEvents.length;
  const cancelledReservations = cancelledEvents.length;
  const totalReservations = confirmedReservations + cancelledReservations;
  const cancellationRatePct =
    totalReservations > 0 ? Number(((cancelledReservations / totalReservations) * 100).toFixed(1)) : 0;

  const spaceMap: Record<string, { confirmed: number; cancelled: number }> = {};

  confirmedEvents.forEach((r) => {
    const sp = r.data.espacioId;
    if (!spaceMap[sp]) spaceMap[sp] = { confirmed: 0, cancelled: 0 };
    spaceMap[sp].confirmed += 1;
  });

  cancelledEvents.forEach((r) => {
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
  const activeInscriptions = inscripcionConfirmadaEvents.length - inscripcionCanceladaEvents.length;

  const inscriptionsPerEvent: Record<string, number> = {};

  inscripcionConfirmadaEvents.forEach((i) => {
    const evtId = i.data.eventoId;
    inscriptionsPerEvent[evtId] = (inscriptionsPerEvent[evtId] || 0) + 1;
  });

  inscripcionCanceladaEvents.forEach((i) => {
    const evtId = i.data.eventoId;
    if (inscriptionsPerEvent[evtId]) {
      inscriptionsPerEvent[evtId] -= 1;
    }
  });

  const inscriptionsByEvent = publicadoEvents.map((e) => {
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
  publicadoEvents.forEach((e) => {
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
