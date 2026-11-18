import { MantineProvider } from '@mantine/core';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { CrossModuleResponse } from '../api/types';
import { DashboardImpactCards } from '../components/common/DashboardImpactCards';
import { DashboardImpactCharts } from '../components/common/DashboardImpactCharts';
import { WasteAffected } from '../components/waste/WasteAffected';

vi.mock('../components/charts/PieChart', () => ({
  PieChart: ({ data }: { data: { name: string; value: number }[] }) => (
    <div>{data.map(({ name, value }) => <span key={name}>{name} {value}</span>)}</div>
  ),
}));
vi.mock('../components/charts/BarChart', () => ({
  BarChart: ({ data }: { data: { etiqueta: string; valor: number }[] }) => (
    <div>{data.map(({ etiqueta, valor }) => <span key={etiqueta}>{etiqueta} {valor}</span>)}</div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// Respuestas de /analytics/{area}/parte2 calculadas con las tablas gold reales del 17/11.
const report = (datos: CrossModuleResponse['datos'], extra: Partial<CrossModuleResponse> = {}) => (
  { fecha_snapshot: '2026-11-17', datos, ...extra } as CrossModuleResponse
);

it('Emergencias muestra las emergencias en bici y su tiempo de resolución', () => {
  const data = report([
    { id: 'c5', valor: 3, detalle: [] },
    { id: 'c5b', valor: 866, unidad: 'min', detalle: [] },
  ] as CrossModuleResponse['datos']);
  render(<><DashboardImpactCards area="emergencies" data={data} /><DashboardImpactCharts area="emergencies" data={data} /></>);
  expect(screen.getByText('Emergencias durante viajes en bicicleta')).toBeInTheDocument();
  expect(screen.getByText('Tiempo promedio de resolución de emergencias durante viajes en bicicleta')).toBeInTheDocument();
  expect(screen.getByText('Viajes en bicicleta 866')).toBeInTheDocument();
  expect(screen.queryByText(/Sólo se informa el promedio de viajes en bicicleta/)).not.toBeInTheDocument();
  expect(screen.getByText('Tiempo de resolución promedio por emergencia')).toBeInTheDocument();
});

it('Reclamos compara los originados por emergencias contra otras causas', () => {
  const data = report([{ id: 'c5', valor: 1, detalle: [{ etiqueta: 'Otras causas', valor: 41 }] }] as CrossModuleResponse['datos']);
  render(<><DashboardImpactCards area="claims" data={data} /><DashboardImpactCharts area="claims" data={data} /></>);
  expect(screen.getByText('Reclamos por accidentes viales')).toBeInTheDocument();
  expect(screen.getByText('Otros reclamos viales 41')).toBeInTheDocument();
});

it('Movilidad y Espacios muestran su tarjeta del caso 5', () => {
  render(<>
    <DashboardImpactCards area="mobility" data={report([{ id: 'c5', valor: 2, detalle: [
      { etiqueta: 'Viajes finalizados normalmente', valor: 36 }] }] as CrossModuleResponse['datos'])} />
    <DashboardImpactCards area="culture" data={report([{ id: 'c5', valor: 12, detalle: [] }] as CrossModuleResponse['datos'], { version_cultura: 2 })} />
  </>);
  expect(screen.getByText('Viajes interrumpidos por accidentes en bicicleta frente a viajes finalizados normalmente')).toBeInTheDocument();
  expect(screen.getByText('Viajes finalizados normalmente: 36')).toBeInTheDocument();
  expect(screen.getByText('Actividades modificadas por accidentes viales')).toBeInTheDocument();
});

it('Residuos muestra su tarjeta y el gráfico por causa con las emergencias', () => {
  const data = report([{ id: 'c5', valor: 1, detalle: [] }] as CrossModuleResponse['datos'], {
    resumen_gold: [{ id: 'waste-cause', titulo: 'Intervenciones por causa publicada', fecha_snapshot: '2026-11-17',
      puntos: [{ etiqueta: 'Operación normal', valor: 41 }, { etiqueta: 'Emergencia', valor: 1 }] }],
  });
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  render(<MantineProvider env="test"><DashboardImpactCards area="waste" data={data} /><WasteAffected report={data} zones={[]} /></MantineProvider>);
  expect(screen.getByText('Intervenciones por accidentes en bicicleta frente a alertas normales')).toBeInTheDocument();
  expect(screen.getByText('Emergencia 1')).toBeInTheDocument();
  expect(screen.queryByText('No se tienen datos suficientes como para formar el gráfico.')).not.toBeInTheDocument();
});
