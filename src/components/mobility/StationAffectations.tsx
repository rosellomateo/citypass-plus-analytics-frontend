import { useState } from 'react';
import { Badge, Group, Select } from '@mantine/core';
import { TriangleAlert } from 'lucide-react';
import type { StationAffectation } from '../../api/types';
import { ChartCard } from '../common/ChartCard/ChartCard';
import { DataTable } from '../common/DataTable/DataTable';

const FIELDS = [
  { key: 'estacion', label: 'Estación', placeholder: 'Todas las estaciones' },
  { key: 'zona', label: 'Zona', placeholder: 'Todas las zonas' },
  { key: 'causa', label: 'Causa', placeholder: 'Todas las causas' },
  { key: 'tipo', label: 'Tipo de afectación', placeholder: 'Todos los tipos' },
] as const;
const EFFECT: Record<string, string> = {
  BLOQUEADA: 'Bloqueo', CAPACIDAD_REDUCIDA: 'Capacidad reducida', FUERA_DE_SERVICIO: 'Fuera de servicio',
};
const STATUS = {
  AFECTADA: { label: 'Afectada', color: 'orange', sort: 0 },
  PROGRAMADA: { label: 'Programada', color: 'blue', sort: 1 },
  RESTAURADA: { label: 'Restaurada', color: 'green', sort: 2 },
};

export function StationAffectations({ rows }: { rows: StationAffectation[] }) {
  const [filters, setFilters] = useState<Partial<Record<typeof FIELDS[number]['key'], string | null>>>({});
  const fields = FIELDS.map((field) => {
    const options = [...new Set(rows.flatMap((row) => {
      const value = row[field.key];
      return value ? [value] : [];
    }))].sort();
    const selected = filters[field.key];
    return { ...field, options, value: selected && options.includes(selected) ? selected : null };
  });
  const visible = rows.filter((row) => fields.every(({ key, value }) => !value || row[key] === value))
    .sort((a, b) => STATUS[a.estado].sort - STATUS[b.estado].sort || a.estacion.localeCompare(b.estacion, 'es-AR'));

  return (
    <ChartCard title="Afectaciones por estación">
      <Group align="end" mb="md">
        {fields.map(({ key, label, placeholder, options, value }) => (
          <Select key={key} label={label} placeholder={placeholder} clearable searchable
            data={options.map((option) => ({ value: option, label: key === 'tipo' ? EFFECT[option] ?? option.replaceAll('_', ' ') : option }))}
            value={value} onChange={(value) => setFilters((current) => ({ ...current, [key]: value }))} />
        ))}
      </Group>
      <DataTable data={visible} keyField="id" emptyMessage="El corte no incluye registros para esta selección."
        columns={[
          { key: 'estacion', label: 'Estación' },
          { key: 'estado', label: 'Estado de la afectación', render: ({ estado }) => (
            <Badge color={STATUS[estado].color} variant="light"
              leftSection={estado === 'AFECTADA' ? <TriangleAlert size={13} aria-hidden /> : undefined}>
              {STATUS[estado].label}
            </Badge>
          ) },
          { key: 'causa', label: 'Causa', render: ({ causa }) => causa ?? 'Sin informar' },
          { key: 'tipo', label: 'Tipo de afectación', render: ({ tipo }) => tipo ? EFFECT[tipo] ?? tipo.replaceAll('_', ' ') : 'Sin informar' },
          { key: 'zona', label: 'Zona', render: ({ zona }) => zona ?? 'Sin informar' },
        ]} />
    </ChartCard>
  );
}
