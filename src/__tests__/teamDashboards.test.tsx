import { MantineProvider } from '@mantine/core';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyticsApi } from '../api/analyticsApi';
import { mockLoginDashboard } from '../data/mocks/teamDashboards.mock';
import { LoginDashboard } from '../pages/LoginDashboard';

vi.mock('../components/charts/BarChart', () => ({ BarChart: () => null }));
vi.mock('../components/charts/PieChart', () => ({ PieChart: () => null }));

function renderDashboard(page: ReactNode, response = mockLoginDashboard) {
  vi.stubEnv('VITE_DATA_SOURCE', 'api');
  vi.spyOn(analyticsApi, 'getLogin').mockResolvedValue(response);
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  return render(<MantineProvider env="test"><MemoryRouter>{page}</MemoryRouter></MantineProvider>);
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Tablero de Login Federado', () => {
  it.each(['2026-11-18', '2026-11-18T00:00:00'])('muestra la fecha del snapshot %s', async (fecha_snapshot) => {
    renderDashboard(<LoginDashboard />, { ...mockLoginDashboard,
      datos: mockLoginDashboard.datos.map((row) => ({ ...row, fecha_snapshot })),
    });
    expect(await screen.findByText('Actividad de autenticación · Corte del 18/11/2026')).toBeInTheDocument();
  });
  it('muestra el informe de Login y las métricas del corte de prueba', async () => {
    renderDashboard(<LoginDashboard />);
    expect(await screen.findByRole('heading', { name: 'Reporte de IA — LOGIN FEDERADO' })).toBeInTheDocument();
    expect(screen.getByText('GPT-5 mini')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: /inicios de sesión exitosos/i })).toHaveTextContent('20');
    expect(screen.getByText('Actividad por departamento')).toBeInTheDocument();
  });

});
