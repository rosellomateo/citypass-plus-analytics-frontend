// src/components/common/DateRangeSelector/DateRangeSelector.tsx
import { useState } from 'react';
import type { DashboardFilters } from '../../../types';
import { CustomDateModal } from './CustomDateModal';
import styles from './DateRangeSelector.module.css';

const RANGES: { value: DashboardFilters['dateRange']; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: '7d', label: 'Semana' },
  { value: '30d', label: 'Mes' },
  { value: 'custom', label: 'Personalizado' },
];

interface DateRangeSelectorProps {
  value: DashboardFilters['dateRange'];
  from?: string;
  to?: string;
  onChange: (range: DashboardFilters['dateRange']) => void;
  onCustomSelect?: (from: string, to: string) => void;
}

export function DateRangeSelector({
  value,
  from,
  to,
  onChange,
  onCustomSelect,
}: DateRangeSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (range: DashboardFilters['dateRange']) => {
    onChange(range);
    if (range === 'custom') {
      setIsModalOpen(true);
    }
  };

  const handleApplyCustom = (selectedFrom: string, selectedTo: string) => {
    if (onCustomSelect) {
      onCustomSelect(selectedFrom, selectedTo);
    } else {
      onChange('custom');
    }
  };

  return (
    <>
      <div className={styles.group} role="group" aria-label="Selector de rango temporal">
        {RANGES.map((range) => (
          <button
            key={range.value}
            className={`${styles.btn} ${value === range.value ? styles.active : ''}`}
            onClick={() => handleClick(range.value)}
            aria-pressed={value === range.value}
            id={`date-range-${range.value}`}
          >
            {range.label}
          </button>
        ))}
      </div>

      <CustomDateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={handleApplyCustom}
        initialFrom={from}
        initialTo={to}
      />
    </>
  );
}

