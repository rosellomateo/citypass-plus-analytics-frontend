import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { analyticsApi } from '../api/analyticsApi';
import type { CrossModuleResponse, EmergencyApiRecord } from '../api/types';
import { DashboardImpactCards } from '../components/common/DashboardImpactCards';
import { DashboardImpactCharts } from '../components/common/DashboardImpactCharts';
import { ActivityOrganizerChart } from '../components/culture/ActivityOrganizerChart';
import { EmergencyCausesChart } from '../components/emergencies/EmergencyCausesChart';
import { getApiClaimsAnalyticsData, getApiCultureAnalyticsData, mapEmergencyApiData } from '../dataSources/apiAnalyticsDataSource';
import { mobilityMetricFallbacks } from '../utils/impactMetrics';

vi.mock('../components/charts/BarChart', () => ({
  BarChart: ({ data }: { data: { etiqueta: string; valor: number }[] }) => (
    <div>{data.map(({ etiqueta, valor }) => <span key={etiqueta}>{etiqueta}: {valor}</span>)}</div>
  ),
}));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllEnvs(); });
const filters = { dateRange: 'all' as const };
const report = (extra: Partial<CrossModuleResponse> = {}): CrossModuleResponse => ({ fecha_snapshot: '2026-11-18', datos: [], ...extra });
const card = (label: string) => screen.getByRole('article', { name: `KPI: ${label}` });
const mobilityReport = (): CrossModuleResponse => report({
  datos: [{ id: 'c1', valor: 100 }, { id: 'c5', valor: 2, detalle: [{ etiqueta: 'Viajes finalizados normalmente', valor: 36 }] }],
  resumen_gold: [{ id: 'mobility-stations', titulo: 'Estaciones afectadas por causa', fecha_snapshot: '2026-11-18',
    puntos: [{ etiqueta: 'Reclamo', valor: 30 }, { etiqueta: 'Evento público', valor: 20 },
      { etiqueta: 'Incidente vial', valor: 12 }, { etiqueta: 'Reserva', valor: 12 }] }],
});

it('does not use affectation chart totals as distinct stations or preventive counts', () => {
  const data = mobilityReport();
  const original = structuredClone(data);
  render(<DashboardImpactCards area="mobility" data={data} showMissing />);
  expect(card('Estaciones afectadas por reclamos')).toHaveTextContent('Sin datos');
  expect(card('Afectaciones preventivas por eventos públicos')).toHaveTextContent('Sin datos');
  expect(card('Estaciones afectadas por incidentes viales')).toHaveTextContent('Sin datos');
  expect(card('Estaciones afectadas por reservas')).toHaveTextContent('Sin datos');
  expect(card('Viajes interrumpidos por emergencias')).toHaveTextContent('2');
  expect(card('Viajes finalizados normalmente')).toHaveTextContent('36');
  expect(card('Viajes interrumpidos por emergencias')).not.toHaveTextContent('36');
  expect(data).toEqual(original);
});

it('preserves explicit zeroes and does not turn a missing metric into zero', () => {
  const data = mobilityReport();
  data.datos.push({ id: 'c2', valor: 0 });
  data.resumen_gold![0].puntos = data.resumen_gold![0].puntos.filter(({ etiqueta }) => etiqueta !== 'Reserva');
  render(<DashboardImpactCards area="mobility" data={data} showMissing />);
  expect(card('Estaciones afectadas por reclamos')).toHaveTextContent('0');
  expect(card('Estaciones afectadas por reservas')).toHaveTextContent('Sin datos');
});

it('accepts cause codes and the normal-operations total without inferring bicycle accidents from other incidents', () => {
  const data = report({ resumen_gold: [
    { id: 'mobility-stations', titulo: '', fecha_snapshot: '2026-11-18', puntos: [{ etiqueta: 'EVENTO_PUBLICO', valor: 9 }] },
    { id: 'mobility-interruptions', titulo: '', fecha_snapshot: '2026-11-18', puntos: [
      { etiqueta: 'Operación normal', valor: 15 }, { etiqueta: 'Incidente vial', valor: 8 },
    ] },
  ] });
  expect(mobilityMetricFallbacks(data)).toEqual([{ id: 'c5b', valor: 15 }]);
  render(<DashboardImpactCards area="mobility" data={data} showMissing />);
  expect(card('Viajes interrumpidos por emergencias')).toHaveTextContent('Sin datos');
});

it('counts claim causes using row_count, preserves case two, and shares the values with the chart', async () => {
  vi.stubEnv('VITE_DATA_SOURCE', 'api');
  const row = { barrio: 'Flores', categoria: 'TRANSITO', prioridad: 'ALTA', origenClasificacion: 'MANUAL',
    estado_actual: 'RECIBIDO', row_count: 7, tiempo_prom_hasta_estado_actual: null, fecha_snapshot: '2026-11-18', causaTipo: 'INCIDENTE_VIAL' };
  const rows = [row, { ...row, causaTipo: 'RESERVA', row_count: 3 }, { ...row, causaTipo: null, row_count: 14 }];
  const original = structuredClone(rows);
  vi.spyOn(analyticsApi, 'getClaims').mockResolvedValue({ datos: rows, informe: {} as never });
  const claims = await getApiClaimsAnalyticsData(filters);
  const data = report({ datos: [{ id: 'c2', valor: 20 }, { id: 'c4', valor: 999 }, { id: 'c6', valor: 999 }] });
  render(<><DashboardImpactCards area="claims" data={data} claimCauses={claims.claimsByCause} showMissing />
    <DashboardImpactCharts area="claims" data={data} claimCauses={claims.claimsByCause} /></>);
  expect(card('Reclamos por incidentes viales')).toHaveTextContent('7');
  expect(card('Reclamos por reservas de espacios públicos')).toHaveTextContent('3');
  expect(card('Reclamos que afectaron a otros servicios')).toHaveTextContent('20');
  expect(screen.getByText('Incidentes viales: 7')).toBeInTheDocument();
  expect(screen.getByText('Reservas de espacios públicos: 3')).toBeInTheDocument();
  expect(rows).toEqual(original);
});

it('does not derive cross-service claim interventions from the origin cause alone', () => {
  render(<DashboardImpactCards area="claims" data={report()} claimCauses={[{ cause: 'RECLAMO', count: 10 }]} showMissing />);
  expect(card('Reclamos que afectaron a otros servicios')).toHaveTextContent('Sin datos');
  expect(card('Reclamos por incidentes viales')).toHaveTextContent('0');
});

it('compares citizen and city organizers with the complete activity total, retaining unclassified activities', async () => {
  vi.stubEnv('VITE_DATA_SOURCE', 'api');
  const base = { categoria: 'Cultura', cantidadMasivas: 0, cantidadAfectadasPorClima: null, fecha_snapshot: '2026-11-18' };
  const rows = [{ ...base, organizadorTipo: 'CIUDADANO', cantidadActividades: 17 },
    { ...base, organizadorTipo: 'CIUADANO', cantidadActividades: 2 },
    { ...base, organizadorTipo: 'CIUDAD', cantidadActividades: 43 },
    { ...base, organizadorTipo: null, cantidadActividades: 66 }];
  const original = structuredClone(rows);
  vi.spyOn(analyticsApi, 'getCulture').mockResolvedValue({ datos: rows, informe: {} as never });
  const culture = await getApiCultureAnalyticsData(filters);
  render(<ActivityOrganizerChart activities={culture.activities!} />);
  expect(screen.getByText('Ciudadanos: 19')).toBeInTheDocument();
  expect(screen.getByText('Ciudad: 43')).toBeInTheDocument();
  expect(screen.getByText('Eventos totales: 128')).toBeInTheDocument();
  expect(rows).toEqual(original);
});

it('shows every emergency cause without interpreting cause counts as increased criticality or dispatched resources', () => {
  const base: EmergencyApiRecord = { estado_actual: 'PENDIENTE', prioridad: 'ALTA', categoria: 'MEDICA', cantidadEmergencias: 2,
    tiempoPromRespuestaDespacho: null, tiempoPromRespuestaLugar: null, fecha_snapshot: '2026-11-18' };
  const rows = ['EVENTO_CLIMATICO', 'RECLAMO', 'EVENTO_PUBLICO', 'MOVILIDAD_BICICLETA', 'INCIDENTE_VIAL', 'RESERVA', 'OTRA_CAUSA', null]
    .map((causaTipo) => ({ ...base, causaTipo }));
  const emergencyData = mapEmergencyApiData(rows, filters);
  render(<><EmergencyCausesChart data={emergencyData} />
    <DashboardImpactCards area="emergencies" data={report({ datos: [{ id: 'c1', valor: 0 }, { id: 'c2', valor: 3 }] })} showMissing /></>);
  expect(screen.getByText('Emergencias por causa')).toBeInTheDocument();
  for (const label of ['Clima', 'Reclamos', 'Evento público', 'Viajes en bicicleta', 'Incidente vial', 'Reserva de espacio público', 'otra causa', 'Sin causa informada']) {
    expect(screen.getByText(`${label}: 2`)).toBeInTheDocument();
  }
  expect(emergencyData.emergenciesByCause?.reduce((total, point) => total + point.valor, 0)).toBe(16);
  expect(card('Emergencias con criticidad afectada por clima')).toHaveTextContent('0');
  expect(card('Emergencias preventivas por eventos públicos')).toHaveTextContent('Sin datos');
});
