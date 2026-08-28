// src/components/common/ErrorState/ErrorState.tsx
import { AlertCircle } from 'lucide-react';
import styles from './ErrorState.module.css';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'No se pudieron cargar los datos.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={styles.container} role="alert">
      <div className={styles.iconBox}>
        <AlertCircle size={28} />
      </div>
      <span className={styles.message}>{message}</span>
      {onRetry && (
        <button className={styles.retryBtn} onClick={onRetry} id="error-retry-btn">
          Reintentar
        </button>
      )}
    </div>
  );
}

export function ErrorCard({ message, onRetry }: ErrorStateProps) {
  return (
    <div className={styles.card}>
      <ErrorState message={message} onRetry={onRetry} />
    </div>
  );
}
