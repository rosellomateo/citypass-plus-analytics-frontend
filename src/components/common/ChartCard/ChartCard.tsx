// src/components/common/ChartCard/ChartCard.tsx
import type { ReactNode } from 'react';
import styles from './ChartCard.module.css';
import { CHART_HEIGHT } from '../../charts/chartTheme';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  loading?: boolean;
  height?: number;
}

export function ChartCard({
  title,
  subtitle,
  children,
  actions,
  loading = false,
  height = CHART_HEIGHT.md,
}: ChartCardProps) {
  if (loading) {
    return <ChartCardSkeleton height={height} />;
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.title}>{title}</span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function ChartCardSkeleton({ height = CHART_HEIGHT.md }: { height?: number }) {
  return (
    <div className={styles.card} aria-busy="true">
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.skeleton} style={{ width: 140, height: 14 }} />
          <div className={styles.skeleton} style={{ width: 200, height: 11, marginTop: 4 }} />
        </div>
      </div>
      <div className={styles.skeleton} style={{ width: '100%', height }} />
    </div>
  );
}
