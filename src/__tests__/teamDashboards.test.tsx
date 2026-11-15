import { MantineProvider } from '@mantine/core';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EdaDashboard } from '../pages/EdaDashboard';
import { LoginDashboard } from '../pages/LoginDashboard';

vi.mock('../components/charts/BarChart', () => ({ BarChart: () => null }));
vi.mock('../components/charts/PieChart', () => ({ PieChart: () => null }));

function renderDemo(page: ReactNode) {
  vi.stubEnv('VITE_DATA_SOURCE', 'mock');
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  return render(<MantineProvider env="test"><MemoryRouter>{page}</MemoryRouter></MantineProvider>);
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Tableros de Login Federado y EDA', () => {
  it('muestra el informe de Login y las métricas del corte de prueba', async () => {
    renderDemo(<LoginDashboard />);
    expect(await screen.findByRole('heading', { name: 'Reporte de IA — LOGIN FEDERADO' })).toBeInTheDocument();
    expect(screen.getByText('GPT-5 mini')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: /inicios de sesión exitosos/i })).toHaveTextContent('20');
    expect(screen.getByText('Actividad por departamento')).toBeInTheDocument();
  });

  it('muestra el informe de EDA y el identificador del evento público vinculado', () => {
    renderDemo(<EdaDashboard />);
    expect(screen.getByRole('heading', { name: /Reporte de IA.*EDA/i })).toBeInTheDocument();
    expect(screen.getByText('GPT-5 mini')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: /Eventos pendientes/i })).toHaveTextContent('14');
    expect(screen.getByText('festival-plaza-demo')).toBeInTheDocument();
  });
});
