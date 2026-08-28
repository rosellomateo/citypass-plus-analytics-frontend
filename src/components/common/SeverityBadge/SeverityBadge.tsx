// src/components/common/SeverityBadge/SeverityBadge.tsx
import type { Severity } from '../../../types';
import styles from './SeverityBadge.module.css';

const SEVERITY_MAP: Record<Severity, { label: string; className: string }> = {
  info: { label: 'Informativo', className: styles.info },
  low: { label: 'Bajo', className: styles.low },
  medium: { label: 'Medio', className: styles.medium },
  high: { label: 'Alto', className: styles.high },
  critical: { label: 'Crítico', className: styles.critical },
};

interface SeverityBadgeProps {
  severity: Severity;
  label?: string;
}

export function SeverityBadge({ severity, label }: SeverityBadgeProps) {
  const config = SEVERITY_MAP[severity] ?? SEVERITY_MAP.info;
  return (
    <span className={`${styles.badge} ${config.className}`}>
      {label ?? config.label}
    </span>
  );
}
