// src/components/common/LoadingState/LoadingState.tsx
import styles from './LoadingState.module.css';

export function LoadingFullPage() {
  return (
    <div className={styles.fullPage}>
      <div className={styles.spinner} aria-label="Cargando..." />
    </div>
  );
}

export function MetricsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={styles.metricsGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.metricSkeleton}>
          <div className={styles.shimmer} style={{ width: '60%', height: 12 }} />
          <div className={styles.shimmer} style={{ width: '40%', height: 28, marginTop: 8 }} />
          <div className={styles.shimmer} style={{ width: '70%', height: 11, marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className={styles.chartSkeleton}>
      <div className={styles.shimmer} style={{ width: '30%', height: 14, marginBottom: 4 }} />
      <div className={styles.shimmer} style={{ width: '50%', height: 11, marginBottom: 16 }} />
      <div className={styles.shimmer} style={{ width: '100%', height }} />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={styles.tableSkeleton}>
      <div className={styles.tableHeader}>
        {[40, 20, 15, 12, 13].map((w, i) => (
          <div key={i} className={styles.shimmer} style={{ width: `${w}%`, height: 12 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.tableRow}>
          {[40, 20, 15, 12, 13].map((w, j) => (
            <div key={j} className={styles.shimmer} style={{ width: `${w}%`, height: 12 }} />
          ))}
        </div>
      ))}
    </div>
  );
}
