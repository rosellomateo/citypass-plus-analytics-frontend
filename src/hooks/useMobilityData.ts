// src/hooks/useMobilityData.ts
import type { DashboardFilters } from '../types';
import { useAsync } from './useAsync';
import { getMobilityAnalyticsData } from '../services/mobilityService';

export function useMobilityData(filters: DashboardFilters) {
  return useAsync(() => getMobilityAnalyticsData(filters), [filters.dateRange, filters.from, filters.to, filters.search]);
}
