import { analyticsApi } from '../../api/analyticsApi';
import { PART2_CASES, PART2_METRICS } from '../../config/crossModuleMetrics';
import { getDataSource } from '../../dataSources/dataSource';
import { useAsync } from '../../hooks/useAsync';
import { formatDate } from '../../utils/dates';
import { ChartCard } from '../common/ChartCard/ChartCard';
import { DataTable } from '../common/DataTable/DataTable';
import { ErrorCard } from '../common/ErrorState/ErrorState';
import { TableSkeleton } from '../common/LoadingState/LoadingState';

export function CrossModuleMetrics({ area }: { area: keyof typeof PART2_METRICS }) {
  const isMock = getDataSource() === 'mock';
  const { data, loading, error, refetch } = useAsync(
    () => isMock ? Promise.resolve(null) : analyticsApi.getCrossModuleMetrics(area), [area, isMock],
  );
  const metricsById = new Map(data?.datos.map((metric) => [metric.id, metric]));
  const rows = PART2_METRICS[area].flatMap((labels, caseIndex) =>
    labels.map((indicator, metricIndex) => {
      const id = `c${caseIndex + 1}${metricIndex === 0 ? '' : 'b'}`;
      const metric = metricsById.get(id);
      return {
        id,
        useCase: PART2_CASES[caseIndex],
        indicator,
        value: metric ? `${metric.valor.toLocaleString('es-AR')}${metric.unidad ? ` ${metric.unidad}` : ''}` : 'Pendiente de datos',
        detail: metric?.detalle,
      };
    }),
  );

  return (
    <section className="section" aria-label="Indicadores entre equipos">
      <ChartCard title="Indicadores entre equipos" subtitle={data?.fecha_snapshot
        ? `Corte del ${formatDate(`${data.fecha_snapshot}T12:00:00`)}`
        : 'Casos de uso de la Parte 2'}>
        {loading ? <TableSkeleton rows={6} /> : (
          <>
            {error && <ErrorCard message="No se pudieron consultar los indicadores entre equipos." onRetry={refetch} />}
            <DataTable
              columns={[
                { key: 'useCase', label: 'Caso de uso' },
                { key: 'indicator', label: 'Indicador' },
                { key: 'value', label: 'Resultado' },
                { key: 'detail', label: 'Desglose', render: (row) => row.detail?.length
                  ? row.detail.map(({ etiqueta, valor }) => `${etiqueta}: ${valor.toLocaleString('es-AR')}`).join(' · ')
                  : '—' },
              ]}
              data={rows}
              keyField="id"
            />
          </>
        )}
      </ChartCard>
    </section>
  );
}
