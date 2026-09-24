// src/hooks/useWasteData.ts
import type { DashboardFilters } from '../types';
import { useAsync } from './useAsync';
import { getWasteAnalyticsData } from '../dataSources/analyticsDataSource';

export function useWasteData(filters: DashboardFilters) {
  return useAsync(
    () => getWasteAnalyticsData(filters),
    [
      filters.dateRange,
      filters.from,
      filters.to,
      filters.search,
      filters.zone,
      filters.wasteType,
      filters.category,
    ]
  );
}
