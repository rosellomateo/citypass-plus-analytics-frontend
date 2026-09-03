// src/services/mobilityService.ts
import type { DashboardFilters, MobilityAnalyticsData } from '../types';
import { mockViajeIniciadoEvents, mockViajeFinalizadoEvents } from '../data/mocks/mobility.mock';
import { delay } from '../utils';
import { isWithinDateRange } from '../utils/dates';

export async function getMobilityAnalyticsData(filters: DashboardFilters): Promise<MobilityAnalyticsData> {
  await delay();

  const started = mockViajeIniciadoEvents.filter((e) => isWithinDateRange(e.metadata.occurredAt, filters));
  const startedMap = new Map(started.map((e) => [e.data.viajeId, e]));

  // CU-M1: Trips by origin station & time slot
  const originCounts: Record<string, number> = {};
  const slotCounts: Record<string, number> = {};

  started.forEach((e) => {
    const st = e.data.estacionOrigenId;
    originCounts[st] = (originCounts[st] || 0) + 1;

    const hour = new Date(e.metadata.occurredAt).getHours();
    const slot = `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`;
    slotCounts[slot] = (slotCounts[slot] || 0) + 1;
  });

  const tripsByOriginStation = Object.entries(originCounts).map(([station, count]) => ({ station, count }));
  const tripsByTimeSlot = Object.entries(slotCounts).map(([slot, count]) => ({ slot, count }));

  // CU-M2: Average trip duration for completed trips
  const durationsMinutes: number[] = [];

  mockViajeFinalizadoEvents.forEach((f) => {
    let durationMin = 0;
    if (f.data.duracionSegundos !== undefined) {
      durationMin = f.data.duracionSegundos / 60;
    } else {
      const sEvt = startedMap.get(f.data.viajeId);
      if (sEvt) {
        const sTime = new Date(sEvt.metadata.occurredAt).getTime();
        const fTime = new Date(f.metadata.occurredAt).getTime();
        durationMin = Math.max(0, (fTime - sTime) / 60000);
      }
    }

    if (durationMin > 0) {
      durationsMinutes.push(durationMin);
    }
  });

  const avgTripDurationMinutes =
    durationsMinutes.length > 0
      ? Number((durationsMinutes.reduce((a, b) => a + b, 0) / durationsMinutes.length).toFixed(1))
      : 0;

  // Simple duration distribution
  let shortTrips = 0; // < 15 min
  let mediumTrips = 0; // 15-30 min
  let longTrips = 0; // > 30 min

  durationsMinutes.forEach((d) => {
    if (d < 15) shortTrips += 1;
    else if (d <= 30) mediumTrips += 1;
    else longTrips += 1;
  });

  const tripDurationDistribution = [
    { range: '< 15 min', count: shortTrips },
    { range: '15 - 30 min', count: mediumTrips },
    { range: '> 30 min', count: longTrips },
  ];

  return {
    totalTripsStarted: started.length,
    tripsByOriginStation,
    tripsByTimeSlot,
    avgTripDurationMinutes,
    tripDurationDistribution,
  };
}
