import { DashboardImpactCards } from '../common/DashboardImpactCards';
import { WasteAffected, WasteAffectedMetric, WasteIncidentMetric } from './WasteAffected';
import type { useDashboardImpact } from '../../hooks/useDashboardImpact';
import { BarChart } from '../charts/BarChart';
import { PieChart } from '../charts/PieChart';
import { ChartCard } from '../common/ChartCard/ChartCard';
import { DashboardHeader } from '../common/DashboardHeader/DashboardHeader';
import { DataTable } from '../common/DataTable/DataTable';
import { FilterBar } from '../common/FilterBar/FilterBar';
import { MetricCard } from '../common/MetricCard/MetricCard';
import type { DashboardFilters, WasteAlertMetrics } from '../../types';
import { useState } from 'react';
import { Badge, Group, Select } from '@mantine/core';
import { alertFillRanges, fillRangeLabel, formatAlertAverage, priorityKey, PRIORITY_COLOR, PRIORITY_RANK, sortAlertDetails } from '../../utils/dashboardPresentation';

interface WasteAlertsDashboardProps {
  data: WasteAlertMetrics;
  impact: ReturnType<typeof useDashboardImpact>;
  filters: DashboardFilters;
  onFilterChange: <K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K]
  ) => void;
}

const CHART_COLORS = ['#4F8A72', '#D99838', '#C83E4D', '#2563A6', '#8FB8D8'];

export function WasteAlertsDashboard({
  data,
  impact,
  filters,
  onFilterChange,
}: WasteAlertsDashboardProps) {
  const [fillZone, setFillZone] = useState<string | null>(null);
  const [tableZone, setTableZone] = useState<string | null>(null);
  const [tablePriority, setTablePriority] = useState<string | null>(null);
  const [tableAlert, setTableAlert] = useState<string | null>(null);
  const fillRanges = alertFillRanges(data.details, fillZone);
  const priorityRows = [...data.alertsByPriority]
    .sort((a, b) => (PRIORITY_RANK[priorityKey(b.priority)] ?? 0) - (PRIORITY_RANK[priorityKey(a.priority)] ?? 0))
    .map((row) => ({ ...row, color: PRIORITY_COLOR[priorityKey(row.priority)] ?? '#64748B' }));
  const details = sortAlertDetails(data.details.filter((row) =>
    (!tableZone || row.zone === tableZone) && (!tablePriority || priorityKey(row.priority) === tablePriority)
    && (!tableAlert || row.alertType === tableAlert)));
  const priorityLabel = (value: string) => {
    const key = priorityKey(value);
    return key === 'CRITICA' ? 'Crítica' : key.charAt(0) + key.slice(1).toLowerCase();
  };
  return (
    <div>
      <DashboardHeader
        title="Tablero de Residuos"
        subtitle="Seguimiento de alertas de llenado y tiempos de resolución."
        aiReport={data.aiReport}
        filters_extra={
          <FilterBar
            filters={[
              {
                key: 'zone',
                label: 'Zona',
                options: data.availableZones.map((zone) => ({ value: zone, label: zone })),
                value: filters.zone ?? 'all',
                onChange: (value) => onFilterChange('zone', value),
              },
              {
                key: 'wasteType',
                label: 'Tipo de alerta',
                options: data.availableAlertTypes.map((alertType) => ({
                  value: alertType,
                  label: alertType,
                })),
                value: filters.wasteType ?? filters.category ?? 'all',
                onChange: (value) => {
                  onFilterChange('wasteType', value);
                  onFilterChange('category', value);
                },
              },
            ]}
            searchValue={filters.search}
            onSearchChange={(value) => onFilterChange('search', value)}
            searchPlaceholder="Buscar por zona, alerta, prioridad..."
          />
        }
      />

      <div className="section">
        <div className="metrics-grid-auto">
          <MetricCard
            metric={{
              label: 'Total de Alertas',
              value: data.totalAlerts,
              sublabel: 'Alertas registradas en el período',
              status: 'info',
            }}
          />
          <MetricCard
            metric={{
              label: 'Alertas Resueltas',
              value: data.resolvedAlerts,
              sublabel: 'Atenciones completadas',
              status: 'normal',
            }}
          />
          <MetricCard
            metric={{
              label: 'Tasa de Resolución',
              value: data.resolutionRatePct,
              unit: '%',
              sublabel: 'Resueltas sobre el total',
              status: data.resolutionRatePct < 70 ? 'warning' : 'normal',
            }}
          />
          <MetricCard
            metric={{
              label: 'Tiempo Prom. de Resolución',
              value: data.avgResolutionTime,
              sublabel: 'Valor promedio informado por Gold',
              status: 'warning',
            }}
          />
          <WasteAffectedMetric report={impact.data} />
          <WasteIncidentMetric report={impact.data} />
          <DashboardImpactCards area="waste" data={impact.data} excludeIds={['c4']} />
        </div>
      </div>

      <div className="section">
        <div className="charts-grid-2">
          <ChartCard
            title="Alertas por Nivel de Llenado"
            subtitle="Cantidad de alertas por rango de llenado (%)"
            actions={<Select aria-label="Zona del nivel de llenado" placeholder="Todas las zonas" data={data.availableZones}
              size="xs" w={165} searchable clearable value={fillZone} onChange={setFillZone} />}
          >
            <PieChart
              data={fillRanges.map((item, index) => ({ ...item, color: CHART_COLORS[index % CHART_COLORS.length] }))}
              showSlicePercent={false}
              height={260}
            />
          </ChartCard>

          <ChartCard title="Alertas por Tipo" subtitle="Distribución por tipo de alerta">
            <BarChart
              data={data.alertsByType}
              xKey="alertType"
              bars={[{ key: 'count', label: 'Alertas', color: '#4F8A72' }]}
              height={260}
            />
          </ChartCard>
        </div>
      </div>

      <div className="section">
        <div className="charts-grid-2">
          <ChartCard title="Alertas por Prioridad" subtitle="Cantidad según prioridad">
            <BarChart
              data={priorityRows}
              xKey="priority"
              bars={[{ key: 'count', label: 'Alertas' }]}
              colorField="color"
              height={330}
            />
          </ChartCard>

          <ChartCard
            title="Tiempo Promedio de Resolución por Zona"
            subtitle="Promedio ponderado por alertas resueltas"
          >
            <BarChart
              data={data.avgResolutionTimeByZone}
              xKey="zone"
              bars={[{ key: 'value', label: 'Tiempo promedio', color: '#2563A6' }]}
              height={330}
              scrollable
              minWidth={Math.max(600, data.avgResolutionTimeByZone.length * 125)}
              xAxisTickAngle={-30}
            />
          </ChartCard>
        </div>
      </div>

      <div className="section">
        <ChartCard
          title="Detalle Agregado de Alertas"
          actions={<Group gap="xs" justify="flex-end">
            <Select aria-label="Zona del detalle de alertas" placeholder="Todas las zonas" data={data.availableZones}
              size="xs" w={150} searchable clearable value={tableZone} onChange={setTableZone} />
            <Select aria-label="Prioridad del detalle de alertas" placeholder="Todas las prioridades"
              data={['CRITICA', 'ALTA', 'MEDIA', 'BAJA'].map((value) => ({ value, label: priorityLabel(value) }))}
              size="xs" w={160} clearable value={tablePriority} onChange={setTablePriority} />
            <Select aria-label="Tipo del detalle de alertas" placeholder="Todos los tipos" data={data.availableAlertTypes}
              size="xs" w={165} searchable clearable value={tableAlert} onChange={setTableAlert} />
          </Group>}
        >
          <DataTable key={`${tableZone}/${tablePriority}/${tableAlert}`} pageSize={10}
            columns={[
              { key: 'zone', label: 'Zona' },
              { key: 'alertType', label: 'Tipo de alerta' },
              { key: 'priority', label: 'Prioridad', render: (row) => <Badge variant="light" color={PRIORITY_COLOR[priorityKey(row.priority)] ?? '#64748B'}>{priorityLabel(row.priority)}</Badge> },
              { key: 'fillRange', label: 'Nivel de llenado', render: (row) => fillRangeLabel(row.fillRange) ?? '' },
              { key: 'alerts', label: 'Alertas' },
              { key: 'resolved', label: 'Resueltas' },
              { key: 'avgResolutionTime', label: 'Tiempo promedio', render: (row) => formatAlertAverage(row.avgResolutionTime) },
            ]}
            data={details}
            keyField="id"
            emptyMessage="No hay alertas para los filtros seleccionados."
          />
        </ChartCard>
      </div>
      <WasteAffected report={impact.data} zones={data.availableZones} />
    </div>
  );
}
