// src/components/common/DashboardHeader/DashboardHeader.tsx
import type { ReactNode } from 'react';
import { Breadcrumbs } from '../../layout/Breadcrumbs/Breadcrumbs';
import { DateRangeSelector } from '../DateRangeSelector/DateRangeSelector';
import type { DashboardFilters } from '../../../types';
import styles from './DashboardHeader.module.css';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  filters: DashboardFilters;
  onDateRangeChange: (range: DashboardFilters['dateRange']) => void;
  actions?: ReactNode;
  filters_extra?: ReactNode;
}

export function DashboardHeader({
  title,
  subtitle,
  filters,
  onDateRangeChange,
  actions,
  filters_extra,
}: DashboardHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.topRow}>
        <Breadcrumbs />
      </div>
      <div className={styles.mainRow}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.controlsGroup}>
          <DateRangeSelector value={filters.dateRange} onChange={onDateRangeChange} />
          {actions}
        </div>
      </div>
      {filters_extra && (
        <div className={styles.filtersRow}>{filters_extra}</div>
      )}
    </div>
  );
}
