import { Network, Megaphone } from 'lucide-react';
import { analyticsApi } from '../api/analyticsApi';
import { ChartCard } from '../components/common/ChartCard/ChartCard';
import { DataTable } from '../components/common/DataTable/DataTable';
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { EmptyState } from '../components/common/EmptyState/EmptyState';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { TableSkeleton } from '../components/common/LoadingState/LoadingState';
import { getDataSource } from '../dataSources/dataSource';
import { mockCoordinationDashboards } from '../data/mocks/teamDashboards.mock';
import { useAsync } from '../hooks/useAsync';
import { formatDate } from '../utils/dates';

export function CoordinationDashboard({ area }: { area: 'dap' | 'eda' }) {
  const isEda = area === 'eda';
  const isMock = getDataSource() === 'mock';
  const { data, loading, error, refetch } = useAsync(
    () => isMock ? Promise.resolve(mockCoordinationDashboards[area]) : analyticsApi.getCrossModuleMetrics(area), [area, isMock],
  );
  return (
    <>
      <DashboardHeader
        title={isEda ? 'EDA' : 'DAP'}
        subtitle={isEda ? 'Recepción y distribución de eventos' : 'Comunicaciones entre equipos'}
      />
      {loading ? <TableSkeleton /> : error ? <ErrorCard message={error} onRetry={refetch} /> : data?.datos.length ? (
        <ChartCard title="Indicadores" subtitle={data.fecha_snapshot
          ? `Corte del ${formatDate(`${data.fecha_snapshot}T12:00:00`)}`
          : undefined}>
          <DataTable data={data.datos} keyField="id" columns={[
            { key: 'etiqueta', label: 'Indicador' },
            { key: 'valor', label: 'Resultado', render: ({ valor, unidad }) =>
              `${valor.toLocaleString('es-AR')}${unidad ? ` ${unidad}` : ''}` },
            { key: 'detalle', label: 'Desglose', render: ({ detalle }) => detalle?.length
              ? detalle.map(({ etiqueta, valor }) => `${etiqueta}: ${valor.toLocaleString('es-AR')}`).join(' · ')
              : '—' },
          ]} />
        </ChartCard>
      ) : <EmptyState
        title="Indicadores pendientes de publicación"
        description={isEda
          ? 'Este tablero mostrará actividad del bus cuando esté disponible su fuente de métricas.'
          : 'Este tablero mostrará indicadores de comunicaciones cuando esté disponible su fuente de datos.'}
        icon={isEda ? <Network size={28} /> : <Megaphone size={28} />}
      />}
    </>
  );
}
