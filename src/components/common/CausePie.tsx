import { useState, type ReactNode } from 'react';
import type { CausePoint, ScopedCauses } from '../../api/types';
import { formatDate } from '../../utils/dates';
import { PieChart } from '../charts/PieChart';
import { CategorySearchFilter } from './CategorySearchFilter/CategorySearchFilter';
import { ChartCard } from './ChartCard/ChartCard';

const COLORS: Record<string, string> = {
  'Evento público': '#2563A6',
  Clima: '#57A9DB',
  Reclamo: '#D99838',
  'Incidente vial': '#C83E4D',
  'Accidente vial': '#794CAC',
  Emergencia: '#D77A64',
  Reserva: '#4F8A72',
  'Operación normal': '#64748B',
};

export function CausePie({ title, points, date, description, note, filters, actions, unit }: {
  title: string;
  points: CausePoint[];
  date?: string;
  description?: string;
  note?: ReactNode;
  actions?: ReactNode;
  unit?: string;
  filters?: { scope: 'estación' | 'zona'; options: string[]; groups: ScopedCauses[] };
}) {
  const [chosen, setChosen] = useState('ALL');
  const options = [...new Set([...(filters?.options ?? []), ...(filters?.groups.map(({ nombre }) => nombre) ?? [])])].sort();
  const selection = options.includes(chosen) ? chosen : 'ALL';
  const scoped = filters?.groups.find(({ nombre }) => nombre === selection);
  const visible = (selection === 'ALL' ? points : scoped?.causas ?? []).filter(({ valor }) => valor > 0)
    .sort((a, b) => b.valor - a.valor || a.etiqueta.localeCompare(b.etiqueta, 'es-AR'));
  const leading = visible.filter(({ valor }) => valor === visible[0]?.valor);
  const subtitle = selection === 'ALL'
    ? [description, date && `Corte del ${formatDate(`${date}T12:00:00`)}`].filter(Boolean).join(' · ')
    : 'Desglose por causa';

  return (
    <ChartCard title={title} subtitle={subtitle} actions={actions ?? (filters && (
      <CategorySearchFilter categories={options} selectedCategory={selection} onSelectCategory={setChosen}
        placeholder={filters.scope === 'zona' ? 'Todas las zonas' : 'Todas las estaciones'}
        ariaLabel={`Filtrar por ${filters.scope}`} />
    ))}>
      {selection !== 'ALL' && !scoped ? (
        <p role="status">Sin desglose publicado para {filters?.scope === 'zona' ? 'esta zona' : 'esta estación'}.</p>
      ) : (
        <>
          {leading.length > 0 && <p>
            <strong>{leading.length > 1 ? 'Causas más frecuentes:' : 'Causa más frecuente:'}</strong>{' '}
            {leading.map(({ etiqueta }) => etiqueta).join(', ')} ({leading[0].valor.toLocaleString('es-AR')}{unit})
          </p>}
          <PieChart data={visible.map(({ etiqueta, valor }) => ({ name: etiqueta, value: valor, color: COLORS[etiqueta] }))}
            donut={false} height={320} unit={unit} />
        </>
      )}
      {note}
    </ChartCard>
  );
}
