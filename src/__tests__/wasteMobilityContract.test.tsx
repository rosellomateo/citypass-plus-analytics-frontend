import { MantineProvider } from '@mantine/core';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { CrossModuleResponse, MobilityApiRecord, WasteApiRecord } from '../api/types';
import { mapMobilityApiData, mapWasteApiData } from '../dataSources/apiAnalyticsDataSource';
import { WasteInterventionsDashboard } from '../components/waste/WasteInterventionsDashboard';
import { MobilityDashboard } from '../pages/MobilityDashboard';
import { useMobilityData } from '../hooks/useMobilityData';
import { useDashboardImpact } from '../hooks/useDashboardImpact';
import { isInterventionResponse } from '../services/wasteInterventionService';

vi.mock('../components/charts/BarChart', () => ({ BarChart: ({ data, bars }: { data: unknown[]; bars: unknown[] }) => <div data-testid="bar">{JSON.stringify({ data, bars })}</div> }));
vi.mock('../components/charts/PieChart', () => ({ PieChart: ({ data }: { data: unknown[] }) => <div data-testid="pie">{JSON.stringify(data)}</div> }));
vi.mock('../hooks/useMobilityData', () => ({ useMobilityData: vi.fn() }));
vi.mock('../hooks/useDashboardImpact', () => ({ useDashboardImpact: vi.fn() }));
beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const filters = { dateRange: 'all' as const };
const wrap = (node: React.ReactNode) => <MantineProvider env="test"><MemoryRouter>{node}</MemoryRouter></MantineProvider>;
const card = (label: string) => screen.getByRole('article', { name: 'KPI: ' + label });
const wasteRow = (prioridad: string, tipoAlerta: string, rangoNivelLlenado: string, cantidadAlertas: number, cantidadResueltas = 0): WasteApiRecord => ({
  prioridad, tipoAlerta, rangoNivelLlenado, cantidadAlertas, cantidadResueltas, zona: 'Caballito',
  tiempoPromResolucion: null, fecha_snapshot: '2026-11-19T00:00:00',
});
const wasteRows = () => [
  wasteRow('AFECTADA', 'EVENTO_PUBLICO', 'INCIDENTE_VIAL', 2),
  wasteRow('CANCELADA', 'RECLAMO', 'INCIDENTE_VIAL', 4),
  wasteRow('AFECTADA', 'RECLAMO', 'EVENTO_CLIMATICO', 3),
  wasteRow('PROGRAMADA', 'EVENTO_PUBLICO', 'SIN AFECTACION', 5),
  wasteRow('COMPLETADA', 'RESERVA', 'SIN AFECTACION', 2, 2),
  { ...wasteRow('AFECTADA', 'SIN CAUSA EXTERNA', 'SIN AFECTACION', 6), zona: null },
];

it('interprets only the translated API fields, distinguishes scheduling from affection and excludes cancelled stops', () => {
  const rows = [...wasteRows(), { ...wasteRows()[0], cantidadAlertas: 999, fecha_snapshot: '2026-11-18' }];
  const original = structuredClone(rows);
  const data = mapWasteApiData(rows, filters);
  expect(data.mode).toBe('interventions');
  if (data.mode !== 'interventions') throw new Error('Wrong contract');
  expect(data).toMatchObject({ total: 22, affected: 11, scheduled: 5, cancelled: 4, completed: 2, completionRatePct: 9.09 });
  expect(data.caseMetrics).toEqual([{ id: 'c1', valor: 3 }, { id: 'c2', valor: 7 }, { id: 'c3', valor: 7 }, { id: 'c4', valor: 2 }, { id: 'c6', valor: 2 }]);
  expect(data.bySchedulingCause.find(({ etiqueta }) => etiqueta === 'Evento público')?.valor).toBe(7);
  expect(data.byAffectionCause.find(({ etiqueta }) => etiqueta === 'Incidente vial')?.valor).toBe(2);
  expect(data.byAffectionCause.find(({ etiqueta }) => etiqueta === 'No informada')?.valor).toBe(6);
  expect(data.byState.reduce((sum, row) => sum + row.count, 0)).toBe(data.total);
  expect(data.byZone.reduce((sum, row) => sum + row.total, 0)).toBe(data.total);
  expect(rows).toEqual(original);
});

it('keeps genuine legacy alerts distinct and does not infer intervention fields from absent parquet columns', () => {
  expect(isInterventionResponse([])).toBe(false);
  const data = mapWasteApiData([{ ...wasteRow('ALTA', 'LLENO', '80-100', 5), tiempoPromResolucion: 20 }], filters);
  expect(data.mode).toBe('alerts');
  expect(data).toMatchObject({ totalAlerts: 5 });
  const translated = mapWasteApiData([{ ...wasteRows()[0], cantidadAfectadas: 999, camionesDistintos: 999 } as WasteApiRecord], filters);
  expect(translated).toMatchObject({ affected: 2 });
});

it('filters intervention quantities consistently by zone, scheduling cause and search', () => {
  const data = mapWasteApiData(wasteRows(), { ...filters, zone: 'Caballito', wasteType: 'RECLAMO', search: 'clima' });
  expect(data).toMatchObject({ mode: 'interventions', total: 3, affected: 3, cancelled: 0, filtered: true });
  expect(data.details).toHaveLength(1);
});

it('renders interventions without obsolete alert priorities, invented resolution times or route panels', () => {
  const data = mapWasteApiData(wasteRows(), filters);
  if (data.mode !== 'interventions') throw new Error('Wrong contract');
  const report: CrossModuleResponse = { fecha_snapshot: '2026-11-19', datos: [{ id: 'c5', valor: 27 }] };
  const view = render(wrap(<WasteInterventionsDashboard data={data} report={report} filters={filters} onFilterChange={vi.fn()} />));
  expect(card('Total de intervenciones')).toHaveTextContent('22');
  expect(card('Intervenciones afectadas por incidentes viales')).toHaveTextContent('2');
  expect(card('Intervenciones originadas en emergencias')).toHaveTextContent('27');
  expect(screen.queryByText('Total de Alertas')).not.toBeInTheDocument();
  expect(screen.queryByText(/Nivel de Llenado|Tiempo Prom|Recorridos afectados/)).not.toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Causa de programación' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Causa de afectación' })).toBeInTheDocument();
  view.rerender(wrap(<WasteInterventionsDashboard data={{ ...data, filtered: true }} report={report} filters={filters} onFilterChange={vi.fn()} />));
  expect(screen.queryByRole('article', { name: 'KPI: Intervenciones originadas en emergencias' })).not.toBeInTheDocument();
  view.rerender(wrap(<WasteInterventionsDashboard data={data} report={{ ...report, fecha_snapshot: '2026-11-18' }} filters={filters} onFilterChange={vi.fn()} />));
  expect(screen.queryByRole('article', { name: 'KPI: Intervenciones originadas en emergencias' })).not.toBeInTheDocument();
});

const mobilityRows = (): MobilityApiRecord[] => [
  ['EMERGENCIA', 81, 29, 1, 1, 0, 78, 6], ['EVENTO_CLIMATICO', 205, 125, 202, 124, 0, 198, 1],
  ['EVENTO_PUBLICO', 20, 19, 2, 2, 14, 4, 0], ['INCIDENTE_VIAL', 12, 12, 1, 1, 0, 8, 12],
  ['NORMAL', 0, 0, 0, 0, 0, 0, 37], ['RECLAMO', 43, 35, 6, 6, 0, 25, 0], ['RESERVA', 12, 12, 0, 0, 0, 5, 0],
].map(([cause, aff, stations, blocked, blockedStations, preventive, restored, trips]) => ({
  causaTipo: String(cause), cantidadAfectaciones: Number(aff), estacionesAfectadasDistintas: Number(stations),
  cantidadBloqueadas: Number(blocked), estacionesBloqueadasDistintas: Number(blockedStations), cantidadPreventivas: Number(preventive),
  cantidadRestauradas: Number(restored), cantidadViajesInterrumpidos: Number(trips), fecha_snapshot: '2026-11-19T00:00:00',
}));

it('uses the latest mobility snapshot and preserves distinct-station units, normal trips and explicit zeroes', async () => {
  const rows = mobilityRows();
  const original = structuredClone(rows);
  const data = await mapMobilityApiData([...rows, { ...rows[0], cantidadAfectaciones: 9999, fecha_snapshot: '2026-11-18' }], filters);
  expect(data).toMatchObject({ totalAffectations: 373, totalBlocked: 212, totalPreventive: 14, totalRestored: 318, interruptedTrips: 19, normalTrips: 37 });
  expect(data.caseMetrics).toEqual([{ id: 'c1', valor: 124 }, { id: 'c2', valor: 35 }, { id: 'c3', valor: 14 },
    { id: 'c4', valor: 12 }, { id: 'c5', valor: 6 }, { id: 'c5b', valor: 37 }, { id: 'c6', valor: 12 }]);
  const filtered = await mapMobilityApiData(rows, { ...filters, search: 'evento público' });
  expect(filtered.caseMetrics).toEqual([{ id: 'c3', valor: 14 }]);
  expect(filtered.interruptedTrips).toBe(0);
  expect(rows).toEqual(original);
});

it('uses the same primary mobility population for cards and the station pie, ignoring conflicting Parte 2 affectation totals', async () => {
  const data = await mapMobilityApiData(mobilityRows(), filters);
  vi.mocked(useMobilityData).mockReturnValue({ data, loading: false, error: null, refetch: vi.fn() } as never);
  vi.mocked(useDashboardImpact).mockReturnValue({ data: { fecha_snapshot: '2026-11-19', datos: [{ id: 'c2', valor: 999 }],
    resumen_gold: [{ id: 'mobility-stations', titulo: '', fecha_snapshot: '2026-11-19', puntos: [{ etiqueta: 'Reclamo', valor: 43 }] }] } } as never);
  render(wrap(<MobilityDashboard />));
  expect(card('Estaciones afectadas por reclamos')).toHaveTextContent('35');
  expect(card('Afectaciones preventivas por eventos públicos')).toHaveTextContent('14');
  expect(card('Viajes interrumpidos por emergencias')).toHaveTextContent('6');
  expect(screen.queryByText(/accidente en bicicleta/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Filtrar por estación' })).not.toBeInTheDocument();
  const pies = screen.getAllByTestId('pie');
  expect(pies.at(-1)).toHaveTextContent('"name":"Reclamo","value":35');
  expect(screen.queryByText('Afectaciones de estaciones por causa')).not.toBeInTheDocument();
  for (const name of ['Estaciones distintas', 'Estaciones distintas bloqueadas', 'Viajes']) {
    expect(screen.queryByRole('columnheader', { name })).not.toBeInTheDocument();
  }
  expect(card('Viajes interrumpidos por emergencias').parentElement).toBe(card('Afectaciones de estaciones').parentElement);
  const bars = screen.getAllByTestId('bar');
  expect(bars.at(-1)).not.toHaveTextContent('"key":"preventivas"');
});

it('orders waste states and counts interventions rather than aggregate rows when filtering the detail', async () => {
  const user = userEvent.setup();
  const data = mapWasteApiData(wasteRows().reverse(), filters);
  if (data.mode !== 'interventions') throw new Error('Wrong contract');
  render(wrap(<WasteInterventionsDashboard data={data} report={null} filters={filters} onFilterChange={vi.fn()} />));
  expect(screen.queryByText(/detectadas/)).not.toBeInTheDocument();
  const rows = screen.getAllByRole('row').slice(1);
  expect(rows.map((row) => within(row).getAllByRole('cell')[1].textContent)).toEqual([
    'Afectada', 'Afectada', 'Afectada', 'Programada', 'Cancelada', 'Completada',
  ]);
  expect(screen.queryByRole('columnheader', { name: 'Completadas' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('textbox', { name: 'Causa de afectación de intervenciones' }));
  await user.click(screen.getByRole('option', { name: 'Incidente vial' }));
  expect(screen.getByRole('status')).toHaveTextContent('6 detectadas');
  await user.click(screen.getByRole('textbox', { name: 'Estado de intervenciones' }));
  await user.click(screen.getByRole('option', { name: 'Afectada' }));
  expect(screen.getByRole('status')).toHaveTextContent('2 detectadas');
  expect(screen.getAllByRole('row')).toHaveLength(2);
});
