import { useEffect } from 'react';
import { analyticsApi } from '../api/analyticsApi';
import type { CrossModuleResponse } from '../api/types';
import type { PART2_METRICS } from '../config/crossModuleMetrics';
import { getDataSource } from '../dataSources/dataSource';
import { useDemoScenario } from '../data/mocks/demoScenario';
import { useAsync } from './useAsync';

type Area = keyof typeof PART2_METRICS | 'eda';
const REFRESH_MS = 15_000;

export function useDashboardImpact(area: Area) {
  const isMock = getDataSource() === 'mock';
  const scenario = useDemoScenario();
  const result = useAsync(async () => {
    if (!isMock) return analyticsApi.getCrossModuleMetrics(area);
    if (scenario === null) return null;
    const response = await fetch(`/__escenarios/${scenario}.json`);
    if (!response.ok) return null;
    const fixture: { reportes: Partial<Record<Area, CrossModuleResponse>> } = await response.json();
    return fixture.reportes[area] ?? null;
  }, [area, isMock, scenario], { retainDataOnError: !isMock, clearDataOnRequest: isMock });

  const { loading, refetch } = result;
  useEffect(() => {
    if (isMock || loading) return;
    const timer = window.setTimeout(refetch, REFRESH_MS);
    return () => window.clearTimeout(timer);
  }, [isMock, loading, refetch]);

  return result;
}
