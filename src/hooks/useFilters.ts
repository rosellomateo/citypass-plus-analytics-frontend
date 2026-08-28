// src/hooks/useFilters.ts
// Hook para gestión de filtros con estado local y sincronización con URL

import { useState, useCallback } from 'react';
import type { DashboardFilters } from '../types';

const DEFAULT_FILTERS: DashboardFilters = {
  dateRange: '7d',
  zone: 'all',
  status: 'all',
  category: 'all',
  search: '',
};

export function useFilters(initial?: Partial<DashboardFilters>) {
  const [filters, setFilters] = useState<DashboardFilters>({
    ...DEFAULT_FILTERS,
    ...initial,
  });

  const updateFilter = useCallback(<K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS, ...initial });
  }, [initial]);

  const updateDateRange = useCallback((
    dateRange: DashboardFilters['dateRange'],
    from?: string,
    to?: string
  ) => {
    setFilters((prev) => ({ ...prev, dateRange, from, to }));
  }, []);

  return { filters, updateFilter, resetFilters, updateDateRange };
}
