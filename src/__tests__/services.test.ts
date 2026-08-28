// src/__tests__/services.test.ts
import { describe, it, expect } from 'vitest';
import { getClaimsAnalyticsData } from '../services/claimsService';
import { getEmergencyAnalyticsData } from '../services/emergencyService';
import { getMobilityAnalyticsData } from '../services/mobilityService';
import { getCultureAnalyticsData } from '../services/cultureService';

const defaultFilters = { dateRange: '7d' as const };

describe('Domain Services Aggregations', () => {
  it('Reclamos service calculates CU-R1 (counts by category/status) and CU-R2 (avg resolution time)', async () => {
    const data = await getClaimsAnalyticsData(defaultFilters);
    expect(data.totalClaims).toBeGreaterThan(0);
    expect(data.claimsByCategory.length).toBeGreaterThan(0);
    expect(data.claimsByStatus.length).toBe(4);
    expect(data.avgResolutionTimeHours).toBeGreaterThanOrEqual(0);
  });

  it('Emergency service calculates CU-E1 (counts by state/priority) and CU-E2 (avg dispatch time)', async () => {
    const data = await getEmergencyAnalyticsData(defaultFilters);
    expect(data.totalEmergencies).toBeGreaterThan(0);
    expect(data.emergenciesByState.length).toBeGreaterThan(0);
    expect(data.emergenciesByPriority.length).toBe(3);
    expect(data.avgDispatchTimeMinutes).toBeGreaterThanOrEqual(0);
  });

  it('Mobility service calculates CU-M1 (trips by station/slot) and CU-M2 (avg trip duration)', async () => {
    const data = await getMobilityAnalyticsData(defaultFilters);
    expect(data.totalTripsStarted).toBeGreaterThan(0);
    expect(data.tripsByOriginStation.length).toBeGreaterThan(0);
    expect(data.tripsByTimeSlot.length).toBeGreaterThan(0);
    expect(data.avgTripDurationMinutes).toBeGreaterThan(0);
  });

  it('Culture service calculates CU-C1 (reservations/cancellation rate) and CU-C2 (inscriptions/occupancy rate)', async () => {
    const data = await getCultureAnalyticsData(defaultFilters);
    expect(data.confirmedReservations).toBeGreaterThan(0);
    expect(data.cancellationRatePct).toBeGreaterThanOrEqual(0);
    expect(data.totalInscriptions).toBeGreaterThan(0);
    expect(data.inscriptionsByEvent.length).toBeGreaterThan(0);
    expect(data.avgOccupancyRatePct).toBeGreaterThan(0);
  });
});
