import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { EmptyState } from '../components/common/EmptyState/EmptyState';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { ChartSkeleton, MetricsGridSkeleton } from '../components/common/LoadingState/LoadingState';
import { WasteAffected } from '../components/waste/WasteAffected';
import { WasteAlertsDashboard } from '../components/waste/WasteAlertsDashboard';
import { useDashboardImpact } from '../hooks/useDashboardImpact';
import { useFilters } from '../hooks/useFilters';
import { useResolvedUiState } from '../hooks/useUiState';
import { useWasteData } from '../hooks/useWasteData';

export function WasteDashboard() {
  const impact = useDashboardImpact('waste');
  const { filters, updateFilter, updateDateRange } = useFilters();
  const waste = useWasteData(filters);
  const resolved = useResolvedUiState(waste);
  if (resolved.data) {
    return <WasteAlertsDashboard data={resolved.data} impact={impact} filters={filters}
      onFilterChange={updateFilter}
      onDateRangeChange={(range) => updateFilter('dateRange', range)}
      onCustomDateSelect={(from, to) => updateDateRange('custom', from, to)} />;
  }
  return (
    <>
      <DashboardHeader title="Tablero de Residuos" subtitle="Seguimiento de alertas de llenado y tiempos de resolución."
        filters={filters} onDateRangeChange={(range) => updateFilter('dateRange', range)}
        onCustomDateSelect={(from, to) => updateDateRange('custom', from, to)} />
      {resolved.loading ? <div className="section"><MetricsGridSkeleton count={4} /><ChartSkeleton /></div>
        : resolved.error ? <ErrorCard message={resolved.error} onRetry={waste.refetch} />
        : <EmptyState description="No hay alertas de residuos para los filtros seleccionados." />}
      <WasteAffected report={impact.data} zones={[]} />
    </>
  );
}
