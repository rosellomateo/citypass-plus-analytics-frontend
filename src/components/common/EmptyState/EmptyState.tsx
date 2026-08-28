// src/components/common/EmptyState/EmptyState.tsx
import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export function EmptyState({
  title = 'Sin datos',
  description = 'No hay información disponible para los filtros seleccionados.',
  icon,
}: EmptyStateProps) {
  return (
    <div className={styles.container} role="status" aria-label={title}>
      <div className={styles.iconBox}>
        {icon ?? <Inbox size={28} />}
      </div>
      <span className={styles.title}>{title}</span>
      <span className={styles.description}>{description}</span>
    </div>
  );
}
