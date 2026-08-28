// src/components/common/DateRangeSelector/DateRangeSelector.tsx
import type { DashboardFilters } from '../../../types';
import styles from './DateRangeSelector.module.css';

const RANGES: { value: DashboardFilters['dateRange']; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: 'custom', label: 'Personalizado' },
];

interface DateRangeSelectorProps {
  value: DashboardFilters['dateRange'];
  onChange: (range: DashboardFilters['dateRange']) => void;
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className={styles.group} role="group" aria-label="Selector de rango temporal">
      {RANGES.map((range) => (
        <button
          key={range.value}
          className={`${styles.btn} ${value === range.value ? styles.active : ''}`}
          onClick={() => onChange(range.value)}
          aria-pressed={value === range.value}
          id={`date-range-${range.value}`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
