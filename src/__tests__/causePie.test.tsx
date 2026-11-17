import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CausePie } from '../components/common/CausePie';

vi.mock('../components/charts/PieChart', () => ({
  PieChart: ({ data }: { data: { name: string; value: number }[] }) => (
    <div>{data.map(({ name, value }) => <span key={name}>{name} {value}</span>)}</div>
  ),
}));

afterEach(cleanup);

it('usa los datos de la zona elegida y no reutiliza los totales si falta el desglose', () => {
  render(<CausePie title="Intervenciones por causa publicada"
    points={[{ etiqueta: 'Evento público', valor: 26 }]}
    filters={{
      scope: 'zona',
      options: ['Centro', 'Flores'],
      groups: [{ nombre: 'Centro', causas: [{ etiqueta: 'Reclamo', valor: 2 }] }],
    }} />);

  expect(screen.getByText('Evento público 26')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Filtrar por zona' }));
  fireEvent.click(screen.getByText('Centro'));
  expect(screen.getByText('Reclamo 2')).toBeInTheDocument();
  expect(screen.queryByText('Evento público 26')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Filtrar por zona' }));
  fireEvent.click(screen.getByText('Flores'));
  expect(screen.getByRole('status')).toHaveTextContent('Sin desglose publicado para esta zona');
  expect(screen.queryByText('Evento público 26')).not.toBeInTheDocument();
});
