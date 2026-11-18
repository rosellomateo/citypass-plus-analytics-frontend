import type { CausePoint, CrossModuleResponse } from '../../api/types';
import type { EmergencyAnalyticsData } from '../../types';
import { BarChart } from '../charts/BarChart';
import { ChartCard } from './ChartCard/ChartCard';

const CLAIM_CAUSES = { c1: 'Alertas climáticas', c2: 'Afectaron a otros módulos', c3: 'Eventos masivos', c4: 'Incidentes viales', c6: 'Eventos ciudadanos' };

export function DashboardImpactCharts({ area, data, emergencyData }: {
  area: 'claims' | 'emergencies';
  data: CrossModuleResponse | null;
  emergencyData?: EmergencyAnalyticsData | null;
}) {
  const metrics = new Map(data?.datos.map((metric) => [metric.id, metric]) ?? []);
  const charts: { title: string; unit: string; points: (CausePoint & { color?: string })[] }[] = [];
  if (area === 'claims' && data) {
    const accident = metrics.get('c5');
    charts.push({
      title: 'Reclamos vinculados a otros servicios', unit: 'Reclamos',
      points: [
        ...Object.entries(CLAIM_CAUSES).flatMap(([id, etiqueta]) => {
          const metric = metrics.get(id);
          return metric ? [{ etiqueta, valor: metric.valor, color: '#2563A6' }] : [];
        }),
        ...(accident ? [{ etiqueta: 'Accidentes en bicicleta', valor: accident.valor, color: '#8FB8D8' },
          ...(accident.detalle ?? []).map((point) => ({ ...point, etiqueta: point.etiqueta === 'Otras causas' ? 'Otros reclamos viales' : point.etiqueta, color: '#2563A6' }))] : []),
      ],
    });
  }
  if (area === 'emergencies') {
    if (emergencyData?.emergenciesByCause?.length) {
      charts.push({ title: 'Emergencias vinculadas a otros servicios', unit: 'Emergencias por causa informada', points: emergencyData.emergenciesByCause });
    }
    const resources = ['c3', 'c4b'].flatMap((id) => {
      const metric = metrics.get(id);
      return metric ? [{ etiqueta: id === 'c3' ? 'Eventos masivos' : 'Incidentes viales', valor: metric.valor }] : [];
    });
    if (resources.length) charts.push({ title: 'Recursos enviados por tipo de evento', unit: 'Recursos o servicios enviados', points: resources });
    // c5b is a bicycle-only mean. Keep its scope visible while other means are unavailable.
    const bicycleResolution = metrics.get('c5b');
    const resolutionPoints = emergencyData?.resolutionByCategory?.length ? emergencyData.resolutionByCategory
      : bicycleResolution ? [{ etiqueta: 'Viajes en bicicleta', valor: bicycleResolution.valor }] : [];
    charts.push({ title: 'Tiempo de resolución promedio por emergencia', unit: 'Minutos por tipo con promedio publicado', points: resolutionPoints });
  }
  const visible = charts.filter(({ points, title }) => points.length || title === 'Tiempo de resolución promedio por emergencia');
  if (!visible.length) return null;
  const snapshot = data?.fecha_snapshot ?? data?.actualizado_en?.slice(0, 10);
  const period = snapshot ? `Corte del ${snapshot.split('-').reverse().join('/')}` : '';
  return (
    <section className="section" aria-label="Impacto de otros servicios">
      <div className={visible.length === 1 ? undefined : 'charts-grid-2'}>
        {visible.map(({ title, unit, points }) => (
          <ChartCard key={title} title={title} subtitle={[unit, period].filter(Boolean).join(' · ')}>
            {points.length ? <BarChart data={points} xKey="etiqueta" bars={[{ key: 'valor', label: unit }]}
              colorField="color" height={Math.max(230, 45 + points.length * 40)} horizontal />
              : <p role="status">Sin tiempos de resolución publicados.</p>}
          </ChartCard>
        ))}
      </div>
    </section>
  );
}
