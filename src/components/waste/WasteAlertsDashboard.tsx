import { BarChart } from '../charts/BarChart';
import { PieChart } from '../charts/PieChart';
import { ChartCard } from '../common/ChartCard/ChartCard';
import { DashboardHeader } from '../common/DashboardHeader/DashboardHeader';
import { DataTable } from '../common/DataTable/DataTable';
import { FilterBar } from '../common/FilterBar/FilterBar';
import { MetricCard } from '../common/MetricCard/MetricCard';
import type { DashboardFilters, WasteAlertMetrics } from '../../types';

interface WasteAlertsDashboardProps {
  data: WasteAlertMetrics;
  filters: DashboardFilters;
  onFilterChange: <K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K]
  ) => void;
  onDateRangeChange: (range: DashboardFilters['dateRange']) => void;
  onCustomDateSelect: (from: string, to: string) => void;
}

const CHART_COLORS = ['#4F8A72', '#D99838', '#C83E4D', '#2563A6', '#8FB8D8'];

export function WasteAlertsDashboard({
  data,
  filters,
  onFilterChange,
  onDateRangeChange,
  onCustomDateSelect,
}: WasteAlertsDashboardProps) {
  return (
    <div>
      <DashboardHeader
        title="Tablero de Residuos"
        subtitle="Seguimiento de alertas de llenado y tiempos de resolución."
        filters={filters}
        aiReport={data.aiReport}
        onDateRangeChange={onDateRangeChange}
        onCustomDateSelect={onCustomDateSelect}
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
        <div className="metrics-grid-4">
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
        </div>
      </div>

      <div className="section">
        <div className="charts-grid-2">
          <ChartCard
            title="Alertas por Nivel de Llenado"
            subtitle="Cantidad de alertas por rango informado"
          >
            <PieChart
              data={data.alertsByFillRange.map((item, index) => ({
                name: item.range,
                value: item.count,
                color: CHART_COLORS[index % CHART_COLORS.length],
              }))}
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
              data={data.alertsByPriority}
              xKey="priority"
              bars={[{ key: 'count', label: 'Alertas', color: '#C83E4D' }]}
              height={260}
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
              height={260}
            />
          </ChartCard>
        </div>
      </div>

      <div className="section">
        <ChartCard
          title="Detalle Agregado de Alertas"
          subtitle="Datos recibidos desde Medallion Gold"
        >
          <DataTable
            columns={[
              { key: 'zone', label: 'Zona' },
              { key: 'alertType', label: 'Tipo de alerta' },
              { key: 'priority', label: 'Prioridad' },
              { key: 'fillRange', label: 'Nivel de llenado' },
              { key: 'alerts', label: 'Alertas' },
              { key: 'resolved', label: 'Resueltas' },
              { key: 'avgResolutionTime', label: 'Tiempo promedio' },
            ]}
            data={data.details}
            keyField="id"
            emptyMessage="No hay alertas para los filtros seleccionados."
          />
        </ChartCard>
      </div>
    </div>
  );
}
