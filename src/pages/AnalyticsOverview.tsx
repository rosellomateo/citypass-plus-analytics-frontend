// src/pages/AnalyticsOverview.tsx
import { Link } from 'react-router-dom';
import { ArrowRight, Info } from 'lucide-react';
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
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
];

export function AnalyticsOverview() {
  const { filters, updateFilter } = useFilters();

  return (
    <div>
      <DashboardHeader
        title="Analítica Urbana"
        subtitle="Módulo analítico basado en arquitectura orientada a eventos (EDA)."
        filters={filters}
        onDateRangeChange={(range) => updateFilter('dateRange', range)}
      />

      <div className="section">
        <div className={styles.introBanner}>
          <div className={styles.introIcon}>
            <Info size={20} />
          </div>
          <div>
            <h3 className={styles.bannerTitle}>Consumidor de Eventos MVP</h3>
            <p className={styles.bannerText}>
              Este módulo escucha eventos publicados por los servicios de la ciudad, deduplica por metadata.eventId y proyecta tableros analíticos de lectura.
            </p>
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Dominios de Analítica</h2>
        <div className={styles.domainGrid}>
          {DOMAIN_NAV_ITEMS.map((item) => (
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
            Eventos consumidos por el MVP
          </div>
          <DataTable
            columns={[
              { key: 'domain', label: 'Dominio', width: '150px' },
              { key: 'eventType', label: 'Tipo de Evento' },
              { key: 'source', label: 'Productor (Source)', width: '180px' },
              { key: 'status', label: 'Estado Especificación', width: '180px' },
            ]}
            data={MVP_EVENTS}
            keyField="eventType"
          />
        </div>
      </div>
    </div>
  );
}
