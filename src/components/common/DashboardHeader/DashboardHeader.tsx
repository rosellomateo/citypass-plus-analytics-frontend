// src/components/common/DashboardHeader/DashboardHeader.tsx
import type { ReactNode } from 'react';
import { Breadcrumbs } from '../../layout/Breadcrumbs/Breadcrumbs';
import { AIAnalysisCard } from '../AIAnalysisCard/AIAnalysisCard';
import type { AIAnalysisReport } from '../../../types';
import styles from './DashboardHeader.module.css';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  filters_extra?: ReactNode;
  aiReport?: AIAnalysisReport;
}

export function DashboardHeader({
  title,
  subtitle,
  actions,
  filters_extra,
  aiReport,
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
          {actions}
        </div>
      </div>
      {aiReport && (
        <div style={{ marginTop: '16px' }}>
          <AIAnalysisCard report={aiReport} />
        </div>
      )}
      {filters_extra && (
        <div className={styles.filtersRow}>{filters_extra}</div>
      )}
    </div>
  );
}

