// src/hooks/useClaimsData.ts
import type { DashboardFilters } from '../types';
import { useAsync } from './useAsync';
import { getClaimsAnalyticsData } from '../services/claimsService';

export function useClaimsData(filters: DashboardFilters) {
  return useAsync(() => getClaimsAnalyticsData(filters), [filters.dateRange, filters.from, filters.to, filters.search]);
}
