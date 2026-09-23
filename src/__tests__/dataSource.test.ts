import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDataSource } from '../dataSources/dataSource';
import { getClaimsAnalyticsData } from '../dataSources/analyticsDataSource';
import {
  mapCultureApiData,
  mapEmergencyApiData,
  mapMobilityApiData,
  mapWasteApiData,
} from '../dataSources/apiAnalyticsDataSource';

const filters = { dateRange: '30d' as const };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('data source selection', () => {
  it.each(['api', 'mock'] as const)('selects %s explicitly', (source) => {
    vi.stubEnv('VITE_DATA_SOURCE', source);
    expect(getDataSource()).toBe(source);
  });

  it('rejects a missing or unsupported value', () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'auto');
    expect(() => getDataSource()).toThrow(
      'VITE_DATA_SOURCE debe configurarse como "api" o "mock".'
    );
  });

  it('uses the existing mocks without calling fetch in mock mode', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'mock');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await getClaimsAnalyticsData(filters);

    expect(result.totalClaims).toBeGreaterThan(0);
    expect(result.records.length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('exposes backend claim records to every chart in api mode', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'api');
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([
          {
            barrio: 'Palermo',
            categoria: 'Alumbrado',
            prioridad: 'Alta',
            origenClasificacion: 'Manual',
            estado_actual: 'Resuelta',
            row_count: 15,
            tiempo_prom_hasta_estado_actual: 24.5,
            fecha_snapshot: new Date().toISOString(),
          },
        ]),
      })
    );

    const result = await getClaimsAnalyticsData(filters);

    expect(result.totalClaims).toBe(15);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].categoria).toBe('Alumbrado');
  });
});

describe('API analytics adapters', () => {
  it('maps aggregated emergency records without inventing categories', () => {
    const result = mapEmergencyApiData(
      [
        {
          estado_actual: 'Resuelta',
          prioridad: 'Alta',
          cantidadEmergencias: 4,
          tiempoPromRespuestaDespacho: 5,
          tiempoPromRespuestaLugar: 9,
          fecha_snapshot: new Date().toISOString(),
        },
      ],
      filters
    );

    expect(result).toMatchObject({
      totalEmergencies: 4,
      closedCount: 4,
      avgDispatchTimeMinutes: 5,
      availableCategories: [],
    });
  });

  it('uses backend counts for mobility totals and averages', async () => {
    const result = await mapMobilityApiData(
      [
        {
          fechaInicio: new Date().toISOString(),
          estacionInicio: 'Central',
          duracionViaje: '12 minutos',
          cantidadViajes: 3,
          duracionTotalViajes: 36,
          promDuracion: 12,
          fecha_snapshot: new Date().toISOString(),
        },
      ],
      filters
    );

    expect(result.totalTrips).toBe(3);
    expect(result.weightedAvgDurationMinutes).toBe(12);
    expect(result.tripsByStation).toEqual([{ station: 'Central', cantidadViajes: 3 }]);
  });

  it('maps culture aggregates to the existing view contract', () => {
    const result = mapCultureApiData(
      [
        {
          recursoId: 'REC-1',
          tipoReserva: 'Presencial',
          categoria: 'Cultural',
          zona: 'Centro',
          cupoMaximo: 100,
          cantidadTotal: 80,
          cantidadConfirmadas: 70,
          cantidadCanceladas: 10,
          inscriptos: 75,
          pctOcupacion: 75,
          fecha_snapshot: new Date().toISOString(),
        },
      ],
      filters
    );

    expect(result).toMatchObject({
      confirmedReservations: 70,
      cancelledReservations: 10,
      totalInscriptions: 75,
      avgOccupancyRatePct: 75,
    });
  });

  it('maps waste alert aggregates without inventing tonnage or containers', () => {
    const result = mapWasteApiData(
      [
        {
          zona: 'Norte',
          tipoAlerta: 'Contenedor lleno',
          prioridad: 'Alta',
          rangoNivelLlenado: '80-100%',
          cantidadAlertas: 20,
          cantidadResueltas: 15,
          tiempoPromResolucion: 35.5,
          fecha_snapshot: new Date().toISOString(),
        },
      ],
      filters
    );

    expect(result).toMatchObject({
      mode: 'alerts',
      totalAlerts: 20,
      resolvedAlerts: 15,
      resolutionRatePct: 75,
      avgResolutionTime: 35.5,
    });
    expect(result.alertsByFillRange).toEqual([{ range: '80-100%', count: 20 }]);
    expect(result.details).toHaveLength(1);
  });
});
