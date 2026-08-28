// src/pages/WastePending.tsx
import { Trash2 } from 'lucide-react';
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { useFilters } from '../hooks/useFilters';
import styles from './WastePending.module.css';

export function WastePending() {
  const { filters, updateFilter } = useFilters();

  return (
    <div>
      <DashboardHeader
        title="Tablero de Residuos"
        subtitle="Estado de especificación del dominio"
        filters={filters}
        onDateRangeChange={(range) => updateFilter('dateRange', range)}
      />

      <div className={styles.container}>
        <div className={styles.iconBox}>
          <Trash2 size={36} />
        </div>
        <span className={styles.pill}>Pendiente de definición</span>
        <h2 className={styles.title}>Tablero en Espera de Especificación</h2>
        <p className={styles.message}>
          Las métricas y eventos de este dominio se incorporarán cuando se valide la documentación del equipo productor.
        </p>
      </div>
    </div>
  );
}
