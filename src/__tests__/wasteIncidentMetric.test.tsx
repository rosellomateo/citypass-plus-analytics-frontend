import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { WasteIncidentMetric } from '../components/waste/WasteAffected';

afterEach(cleanup);

it('muestra las dos paradas publicadas para el caso 4', () => {
  render(<WasteIncidentMetric report={{
    fecha_snapshot: '2026-11-16',
    datos: [{ id: 'c4', valor: 2 }],
  }} />);

  const card = screen.getByRole('article', {
    name: 'KPI: Intervenciones afectadas por incidentes viales',
  });
  expect(card).toHaveTextContent('2');
  expect(card).toHaveTextContent('Paradas distintas afectadas');
});

it('conserva el cero publicado y no usa totales de otros indicadores si falta c4', () => {
  const { rerender } = render(<WasteIncidentMetric report={{
    fecha_snapshot: '2026-11-16',
    datos: [{ id: 'c4', valor: 0 }],
  }} />);

  expect(screen.getByText('0', { exact: true })).toBeInTheDocument();
  rerender(<WasteIncidentMetric report={{
    fecha_snapshot: '2026-11-16',
    datos: [{ id: 'c1', valor: 5 }],
    resumen_gold: [{
      id: 'waste-affected',
      titulo: 'Intervenciones afectadas por causa',
      fecha_snapshot: '2026-11-16',
      puntos: [{ etiqueta: 'Incidente vial', valor: 9 }],
    }],
  }} />);
  expect(screen.getByText('Sin datos', { exact: true })).toBeInTheDocument();
});
