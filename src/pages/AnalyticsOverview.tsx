// src/pages/AnalyticsOverview.tsx
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { FilterBar } from '../components/common/FilterBar/FilterBar';
import { DOMAIN_NAV_ITEMS } from '../config/domains';
import { DataTable } from '../components/common/DataTable/DataTable';
import { useFilters } from '../hooks/useFilters';
import styles from './AnalyticsOverview.module.css';

const MVP_EVENTS = [
  { domain: 'Reclamos', eventType: 'reclamos.creado', source: 'claims-service', status: 'Documentado' },
  { domain: 'Reclamos', eventType: 'reclamos.actualizado', source: 'claims-service', status: 'Documentado' },
  { domain: 'Emergencias', eventType: 'EmergenciaCreada', source: 'emergency-service', status: 'Documentado' },
  { domain: 'Emergencias', eventType: 'EmergenciaPriorizada', source: 'emergency-service', status: 'Documentado' },
  { domain: 'Emergencias', eventType: 'EmergenciaEstadoActualizado', source: 'emergency-service', status: 'Documentado' },
  { domain: 'Emergencias', eventType: 'EmergenciaDespachada', source: 'emergency-service', status: 'Documentado' },
  { domain: 'Emergencias', eventType: 'EmergenciaCerrada', source: 'emergency-service', status: 'Documentado' },
  { domain: 'Movilidad', eventType: 'movilidad.viaje.iniciado', source: 'mobility-service', status: 'A confirmar' },
  { domain: 'Movilidad', eventType: 'movilidad.viaje.finalizado', source: 'mobility-service', status: 'A confirmar' },
  { domain: 'Cultura', eventType: 'espacios.reserva.confirmada', source: 'culture-service', status: 'Pendiente confirmación' },
  { domain: 'Cultura', eventType: 'espacios.reserva.cancelada', source: 'culture-service', status: 'Pendiente confirmación' },
  { domain: 'Cultura', eventType: 'espacios.evento.publicado', source: 'culture-service', status: 'Pendiente confirmación' },
  { domain: 'Cultura', eventType: 'espacios.inscripcion.confirmada', source: 'culture-service', status: 'Pendiente confirmación' },
  { domain: 'Cultura', eventType: 'espacios.inscripcion.cancelada', source: 'culture-service', status: 'Pendiente confirmación' },
  { domain: 'Cultura', eventType: 'espacios.evento.cancelado', source: 'culture-service', status: 'Complementario' },
  { domain: 'Residuos', eventType: 'Contrato JSON de entrada', source: 'waste-service (simulado)', status: 'Dashboard disponible (contrato a definir)' },
];

const DOMAIN_OPTIONS = [
  { value: 'Reclamos', label: 'Reclamos' },
  { value: 'Emergencias', label: 'Emergencias' },
  { value: 'Movilidad', label: 'Movilidad' },
  { value: 'Cultura', label: 'Cultura' },
  { value: 'Residuos', label: 'Residuos' },
];

export function AnalyticsOverview() {
  const { filters, updateFilter } = useFilters();

  const eventTypeOptions = useMemo(() => {
    return MVP_EVENTS.map((e) => ({ value: e.eventType, label: `${e.domain}: ${e.eventType}` }));
  }, []);

  const filteredEvents = useMemo(() => {
    return MVP_EVENTS.filter((evt) => {
      if (filters.domain && (filters.domain as string) !== 'all') {
        const domLower = String(filters.domain).toLowerCase();
        if (evt.domain.toLowerCase() !== domLower) return false;
      }
      if (filters.category && filters.category !== 'all') {
        if (evt.eventType.toLowerCase() !== filters.category.toLowerCase()) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match =
          evt.domain.toLowerCase().includes(q) ||
          evt.eventType.toLowerCase().includes(q) ||
          evt.source.toLowerCase().includes(q) ||
          evt.status.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [filters]);

  const filteredDomainItems = useMemo(() => {
    return DOMAIN_NAV_ITEMS.filter((item) => {
      if (filters.domain && (filters.domain as string) !== 'all') {
        const domLower = String(filters.domain).toLowerCase();
        const itemDomainLower = item.domain.toLowerCase();
        const itemLabelLower = item.label.toLowerCase();
        if (itemDomainLower !== domLower && !itemLabelLower.includes(domLower)) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match =
          item.label.toLowerCase().includes(q) ||
          item.shortDescription.toLowerCase().includes(q) ||
          item.domain.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [filters]);

  return (
    <div>
      <DashboardHeader
        title="Analítica Urbana"
        subtitle="Módulo analítico basado en arquitectura orientada a eventos (EDA)."
        filters={filters}
        onDateRangeChange={(range) => updateFilter('dateRange', range)}
        onCustomDateSelect={(from, to) => {
          updateFilter('from', from);
          updateFilter('to', to);
          updateFilter('dateRange', 'custom');
        }}
        filters_extra={
          <FilterBar
            filters={[
              {
                key: 'domain',
                label: 'Tipo de Dominio',
                options: DOMAIN_OPTIONS,
                value: String(filters.domain ?? 'all'),
                onChange: (val) => updateFilter('domain', val as any),
              },
              {
                key: 'category',
                label: 'Tipo de Evento',
                options: eventTypeOptions,
                value: filters.category ?? 'all',
                onChange: (val) => updateFilter('category', val),
              },
            ]}
            searchValue={filters.search}
            onSearchChange={(val) => updateFilter('search', val)}
            searchPlaceholder="Buscar por dominio, tipo de evento o fuente..."
          />
        }
      />

      <div className="section">
        <h2 className="section-title">Dominios de Analítica</h2>
        <div className={styles.domainGrid}>
          {filteredDomainItems.map((item) => (
            <div
              key={item.domain}
              className={`${styles.card} ${item.isPending ? styles.pendingCard : ''}`}
            >
              <div className={styles.cardHeader}>
                <span className={styles.badge} style={{ backgroundColor: item.bgColor, color: item.color }}>
                  {item.label}
                </span>
                {item.isPending && <span className={styles.pendingPill}>Pendiente</span>}
              </div>
              <p className={styles.cardDesc}>{item.shortDescription}</p>
              {!item.isPending ? (
                <Link to={item.path} className={styles.cardLink}>
                  Ver Tablero <ArrowRight size={14} />
                </Link>
              ) : (
                <span className={styles.disabledLink}>Próximamente</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className={styles.tableWrapper}>
          <div className={styles.tableTitle}>
            Eventos consumidos por el MVP ({filteredEvents.length} resultados)
          </div>
          <DataTable
            columns={[
              { key: 'domain', label: 'Dominio', width: '150px' },
              { key: 'eventType', label: 'Tipo de Evento' },
              { key: 'source', label: 'Productor (Source)', width: '180px' },
              { key: 'status', label: 'Estado Especificación', width: '180px' },
            ]}
            data={filteredEvents}
            keyField="eventType"
          />
        </div>
      </div>
    </div>
  );
}
