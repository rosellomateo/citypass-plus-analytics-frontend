// src/hooks/useCultureData.ts
import type { DashboardFilters } from '../types';
import { useAsync } from './useAsync';
import { getCultureAnalyticsData } from '../services/cultureService';

export function useCultureData(filters: DashboardFilters) {
  return useAsync(() => getCultureAnalyticsData(filters), [filters.dateRange, filters.from, filters.to, filters.search]);
}
