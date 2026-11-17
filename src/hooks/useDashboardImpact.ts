import { useEffect, useRef } from 'react';
import { ApiError } from '../api/client';
import { analyticsApi } from '../api/analyticsApi';
import type { PART2_METRICS } from '../config/crossModuleMetrics';
import { getDataSource } from '../dataSources/dataSource';
import { useAsync } from './useAsync';

type Area = keyof typeof PART2_METRICS | 'eda';
const REFRESH_MS = 15_000;

export function useDashboardImpact(area: Area) {
  const isEmbedded = getDataSource() === 'embedded';
  const unavailableAreas = useRef(new Set<Area>());
  const result = useAsync(async () => {
    if (isEmbedded) return null;
    try {
      const response = await analyticsApi.getCrossModuleMetrics(area);
      unavailableAreas.current.delete(area);
      return response;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) unavailableAreas.current.add(area);
      else unavailableAreas.current.delete(area);
      throw error;
    }
  }, [area, isEmbedded], { retainDataOnError: true });

  const { loading, refetch } = result;
  useEffect(() => {
    if (isEmbedded || loading || unavailableAreas.current.has(area)) return;
    const timer = window.setTimeout(refetch, REFRESH_MS);
    return () => window.clearTimeout(timer);
  }, [area, isEmbedded, loading, refetch]);

  return result;
}
