import { useEffect, useRef } from 'react';
import { ApiError } from '../api/client';
import { analyticsApi } from '../api/analyticsApi';
import { readEmbeddedPart2 } from '../api/embeddedApi';
import type { EmbedModule } from '../embed/module';
import type { PART2_METRICS } from '../config/crossModuleMetrics';
import { getDataSource } from '../dataSources/dataSource';
import { useAsync } from './useAsync';

type Area = keyof typeof PART2_METRICS | 'eda';
const REFRESH_MS = 15_000;
// En el embed, Parte 2 viene inyectado en el paquete del módulo: no se pide ni se refresca.
const EMBED_MODULE_BY_AREA: Partial<Record<Area, EmbedModule>> = {
  claims: 'reclamos',
  emergencies: 'emergencias',
  mobility: 'movilidad',
  culture: 'espacios',
  waste: 'residuos',
};

export function useDashboardImpact(area: Area) {
  const isEmbedded = getDataSource() === 'embedded';
  const unavailableAreas = useRef(new Set<Area>());
  const result = useAsync(async () => {
    if (isEmbedded) {
      const module = EMBED_MODULE_BY_AREA[area];
      return module ? readEmbeddedPart2(module) : null;
    }
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
