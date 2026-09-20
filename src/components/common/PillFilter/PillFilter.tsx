// src/components/common/PillFilter/PillFilter.tsx
import styles from './PillFilter.module.css';

export interface PillOption {
  value: string;
  label: string;
}

interface PillFilterProps {
  options: PillOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export function PillFilter({ options, selectedValue, onChange, ariaLabel = 'Filtro por píldoras' }: PillFilterProps) {
  return (
    <div className={styles.pillGroup} role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`${styles.pill} ${isSelected ? styles.pillSelected : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
