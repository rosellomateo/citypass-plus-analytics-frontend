// src/components/common/MetricCard/MetricCard.tsx
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Metric } from '../../../types';
import { formatNumber, formatVariation } from '../../../utils';
import styles from './MetricCard.module.css';

interface MetricCardProps {
  metric: Metric;
  icon?: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  loading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  normal: '#4F8A72',
  warning: '#D99838',
  critical: '#C83E4D',
  info: '#2563A6',
};

export function MetricCard({ metric, icon, iconColor = '#2563A6', iconBg = '#EBF3FC', loading = false }: MetricCardProps) {
  if (loading) {
    return <MetricCardSkeleton />;
  }

  const numValue = typeof metric.value === 'number' ? formatNumber(metric.value) : metric.value;

  return (
    <div className={styles.card} role="article" aria-label={`KPI: ${metric.label}`}>
      <div className={styles.header}>
        <div className={styles.labelRow}>
          <span className={styles.label}>{metric.label}</span>
        </div>
        {icon && (
          <div
            className={styles.iconBox}
            style={{ backgroundColor: iconBg }}
            aria-hidden="true"
          >
            <span style={{ color: iconColor }}>{icon}</span>
          </div>
        )}
      </div>

      <div className={styles.valueRow}>
        <span className={styles.value}>{numValue}</span>
        {metric.unit && <span className={styles.unit}>{metric.unit}</span>}
      </div>

      {(metric.variation !== undefined || metric.sublabel || metric.status) && (
        <div className={styles.footer}>
          {metric.variation !== undefined && (
            <span
              className={`${styles.variation} ${metric.variation >= 0 ? styles.up : styles.down}`}
            >
              {metric.variation >= 0 ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              {formatVariation(metric.variation)}
            </span>
          )}
          {metric.sublabel && (
            <span className={styles.sublabel}>{metric.sublabel}</span>
          )}
          {metric.status && (
            <span
              className={`${styles.statusDot} ${styles[metric.status]}`}
              aria-label={`Estado: ${metric.status}`}
              style={{ backgroundColor: STATUS_COLORS[metric.status] }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className={styles.card} aria-busy="true" aria-label="Cargando métrica">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: '60%', height: 12, background: '#F0F2F5', borderRadius: 4 }} />
        <div style={{ width: 36, height: 36, background: '#F0F2F5', borderRadius: 8 }} />
      </div>
      <div style={{ width: '45%', height: 28, background: '#F0F2F5', borderRadius: 6, marginTop: 4 }} />
      <div style={{ width: '70%', height: 12, background: '#F0F2F5', borderRadius: 4 }} />
    </div>
  );
}
