import { DashboardImpactCards } from '../components/common/DashboardImpactCards';
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
  const { filters, updateFilter } = useFilters();
  const waste = useWasteData(filters);
  const resolved = useResolvedUiState(waste);
  if (resolved.data) {
    return <WasteAlertsDashboard data={resolved.data} impact={impact} filters={filters}
      onFilterChange={updateFilter} />;
  }
  return (
    <>
      <DashboardHeader title="Tablero de Residuos" subtitle="Seguimiento de alertas de llenado y tiempos de resolución." />
      {resolved.loading ? <div className="section"><MetricsGridSkeleton count={4} /><ChartSkeleton /></div>
        : resolved.error ? <ErrorCard message={resolved.error} onRetry={waste.refetch} />
        : <EmptyState description="No hay alertas de residuos para los filtros seleccionados." />}
      {!resolved.loading && <DashboardImpactCards area="waste" data={impact.data} standalone />}
      <WasteAffected report={impact.data} zones={[]} />
    </>
  );
}
