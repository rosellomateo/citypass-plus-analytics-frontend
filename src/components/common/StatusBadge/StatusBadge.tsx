// src/components/common/StatusBadge/StatusBadge.tsx
import styles from './StatusBadge.module.css';

type Status = 'normal' | 'warning' | 'critical' | 'info' | 'offline' | 'active' | 'resolved' | 'pending';

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

const STATUS_MAP: Record<Status, { label: string; className: string }> = {
  normal: { label: 'Normal', className: styles.normal },
  active: { label: 'Activo', className: styles.normal },
  resolved: { label: 'Resuelto', className: styles.normal },
  warning: { label: 'Advertencia', className: styles.warning },
  pending: { label: 'Pendiente', className: styles.warning },
  critical: { label: 'Crítico', className: styles.critical },
  info: { label: 'Info', className: styles.info },
  offline: { label: 'Offline', className: styles.offline },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? STATUS_MAP.info;
  return (
    <span className={`${styles.badge} ${config.className}`}>
      <span className={styles.dot} />
      {label ?? config.label}
    </span>
  );
}
