// src/hooks/useEmergencyData.ts
import type { DashboardFilters } from '../types';
import { useAsync } from './useAsync';
import { getEmergencyAnalyticsData } from '../services/emergencyService';

export function useEmergencyData(filters: DashboardFilters) {
  return useAsync(() => getEmergencyAnalyticsData(filters), [filters.dateRange, filters.from, filters.to, filters.search]);
}
