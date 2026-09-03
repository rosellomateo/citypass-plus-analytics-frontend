// src/__tests__/wasteService.test.ts
import { describe, it, expect } from 'vitest';
import { getWasteAnalyticsData } from '../services/wasteService';
import type { DashboardFilters } from '../types';

const defaultFilters: DashboardFilters = { dateRange: '7d' };

describe('Waste Service Analytics (wasteService.ts)', () => {
  it('1. Calculates totalCollectedTons correctly', async () => {
    const data = await getWasteAnalyticsData(defaultFilters);
    expect(data.totalCollectedTons).toBeGreaterThan(0);
  });

  it('2. Calculates criticalContainersCount including CRÍTICO and DESBORDADO (>80%)', async () => {
    const data = await getWasteAnalyticsData(defaultFilters);
    const criticalPlusOverflow = data.containersByStatus.find((s) => s.status === 'CRÍTICO')!.count +
      data.containersByStatus.find((s) => s.status === 'DESBORDADO')!.count;

    expect(data.criticalContainersCount).toBe(criticalPlusOverflow);
  });

  it('3. Calculates onTimeCollectionRatePct within 0-100%', async () => {
    const data = await getWasteAnalyticsData(defaultFilters);
    expect(data.onTimeCollectionRatePct).toBeGreaterThanOrEqual(0);
    expect(data.onTimeCollectionRatePct).toBeLessThanOrEqual(100);
  });

  it('4. Calculates avgCollectionTimeHours', async () => {
    const data = await getWasteAnalyticsData(defaultFilters);
    expect(data.avgCollectionTimeHours).toBeGreaterThan(0);
  });

  it('5. Groups containersByStatus with 4 documented statuses', async () => {
    const data = await getWasteAnalyticsData(defaultFilters);
    expect(data.containersByStatus).toHaveLength(4);
    const statuses = data.containersByStatus.map((s) => s.status);
    expect(statuses).toEqual(['NORMAL', 'MEDIO', 'CRÍTICO', 'DESBORDADO']);
  });

  it('6. Aggregates volumeByWasteType for documented waste categories', async () => {
    const data = await getWasteAnalyticsData(defaultFilters);
    expect(data.volumeByWasteType.length).toBeGreaterThanOrEqual(4);
    const types = data.volumeByWasteType.map((v) => v.wasteType);
    expect(types).toContain('Orgánico');
    expect(types).toContain('Reciclable');
  });

  it('7. Calculates avgCollectionTimeByZone for zones', async () => {
    const data = await getWasteAnalyticsData(defaultFilters);
    expect(data.avgCollectionTimeByZone.length).toBeGreaterThan(0);
    data.avgCollectionTimeByZone.forEach((z) => {
      expect(z.hours).toBeGreaterThanOrEqual(0);
    });
  });

  it('8. Sorts criticalContainersDetail descending by fillLevelPct', async () => {
    const data = await getWasteAnalyticsData(defaultFilters);
    const details = data.criticalContainersDetail;
    expect(details.length).toBeGreaterThan(0);

    for (let i = 0; i < details.length - 1; i++) {
      expect(details[i].fillLevelPct).toBeGreaterThanOrEqual(details[i + 1].fillLevelPct);
    }
  });

  it('9. Filters data correctly by zone and wasteType', async () => {
    const filteredByZone = await getWasteAnalyticsData({ ...defaultFilters, zone: 'Centro' });
    expect(filteredByZone.criticalContainersDetail.every((c) => c.zone === 'Centro')).toBe(true);

    const filteredByType = await getWasteAnalyticsData({ ...defaultFilters, wasteType: 'Orgánico' });
    expect(filteredByType.criticalContainersDetail.every((c) => c.wasteType === 'Orgánico')).toBe(true);
  });
});
