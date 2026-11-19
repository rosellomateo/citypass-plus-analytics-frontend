import { MantineProvider } from '@mantine/core';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { CrossModuleResponse, EmergencyApiRecord } from '../api/types';
import { mapEmergencyApiData } from '../dataSources/apiAnalyticsDataSource';
import { useEmergencyData } from '../hooks/useEmergencyData';
import { useDashboardImpact } from '../hooks/useDashboardImpact';
import { EmergenciesDashboard } from '../pages/EmergenciesDashboard';

vi.mock('../hooks/useEmergencyData', () => ({ useEmergencyData: vi.fn() }));
vi.mock('../hooks/useDashboardImpact', () => ({ useDashboardImpact: vi.fn() }));
vi.mock('../components/charts/BarChart', () => ({ BarChart: ({ data }: { data: unknown[] }) => <div data-testid="bar">{JSON.stringify(data)}</div> }));
vi.mock('../components/charts/PieChart', () => ({ PieChart: () => null }));
beforeEach(() => vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const row: EmergencyApiRecord = { estado_actual: 'PENDIENTE', prioridad: 'ALTA', categoria: 'MEDICA',
  causaTipo: 'EVENTO_PUBLICO', cantidadEmergencias: 10, criticidadAfectada: 2, afectaCirculacion: true,
  tiempoPromRespuestaDespacho: 5, tiempoPromRespuestaLugar: 8, fecha_snapshot: '2026-11-19' };
const filters = { dateRange: 'all' as const };
const report: CrossModuleResponse = { fecha_snapshot: '2026-11-19', datos: [
  { id: 'c1', valor: 0 }, { id: 'c2', valor: 6 }, { id: 'c3', valor: 5 }, { id: 'c4', valor: 0 },
  { id: 'c5', valor: 10 }, { id: 'c5b', valor: 492.3, unidad: 'min' }, { id: 'c6', valor: 3 },
] };
const wrap = () => <MantineProvider env="test"><MemoryRouter><EmergenciesDashboard /></MemoryRouter></MantineProvider>;
function setup(rows: EmergencyApiRecord[], impact = report) {
  vi.mocked(useEmergencyData).mockReturnValue({ data: mapEmergencyApiData(rows, filters), loading: false, error: null, refetch: vi.fn() } as never);
  vi.mocked(useDashboardImpact).mockReturnValue({ data: impact, loading: false } as never);
}

it('keeps useful totals and bicycle time while removing duplicate case cards, unknown-state card and the empty resolution chart', () => {
  setup([row, { ...row, estado_actual: null, causaTipo: null, cantidadEmergencias: 1, criticidadAfectada: 1 }]);
  render(wrap());
  for (const label of ['Total Emergencias', 'Emergencias Activas', 'Emergencias Cerradas', 'Emergencias con circulación afectada', 'Tiempo Prom. de Despacho', 'Tiempo promedio de llegada']) {
    expect(screen.getByRole('article', { name: 'KPI: ' + label })).toBeInTheDocument();
  }
  for (const label of ['Emergencias sin estado', 'Emergencias con criticidad afectada', 'Emergencias con criticidad afectada por clima',
    'Emergencias originadas por reclamos', 'Emergencias preventivas por eventos públicos', 'Emergencias por incidentes viales',
    'Recursos enviados por incidentes viales', 'Emergencias durante viajes en bicicleta', 'Emergencias originadas por eventos ciudadanos']) {
    expect(screen.queryByRole('article', { name: 'KPI: ' + label })).not.toBeInTheDocument();
  }
  expect(screen.getByRole('article', { name: 'KPI: Tiempo promedio de resolución de emergencias durante viajes en bicicleta' })).toHaveTextContent('492,3');
  expect(screen.queryByText('Tiempo de resolución promedio por emergencia')).not.toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Cambios de criticidad' })).toHaveTextContent('"etiqueta":"Evento público","valor":2');
  expect(screen.getByRole('region', { name: 'Cambios de criticidad' })).toHaveTextContent('"etiqueta":"Sin causa informada","valor":1');
  expect(screen.queryByText('Emergencias con criticidad aumentada')).not.toBeInTheDocument();
});

it('shows resources only when explicitly published and substitutes the general resolution chart for the bicycle-time card when available', () => {
  setup([{ ...row, tiempoPromResolucion: 30 }], { ...report, datos: [...report.datos, { id: 'c4b', valor: 0 }] });
  render(wrap());
  expect(screen.getByRole('article', { name: 'KPI: Recursos enviados por incidentes viales' })).toHaveTextContent('0');
  expect(screen.getByText('Tiempo de resolución promedio por emergencia')).toBeInTheDocument();
  expect(screen.queryByRole('article', { name: 'KPI: Tiempo promedio de resolución de emergencias durante viajes en bicicleta' })).not.toBeInTheDocument();
});

it('does not multiply criticality counters by emergency counts or turn missing causes into public-event links', () => {
  const rows = [row, { ...row, causaTipo: '', criticidadAfectada: 1 }, { ...row, causaTipo: 'RECLAMO', criticidadAfectada: null }];
  const original = structuredClone(rows);
  const data = mapEmergencyApiData(rows, filters);
  expect(data.affectedCriticalityByCause).toEqual([{ etiqueta: 'Evento público', valor: 2 }, { etiqueta: 'Sin causa informada', valor: 1 }]);
  expect(data.affectedCriticalityCount).toBeUndefined();
  expect(rows).toEqual(original);
});
