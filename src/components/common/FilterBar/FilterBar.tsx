// src/components/common/FilterBar/FilterBar.tsx
import styles from './FilterBar.module.css';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  filters: FilterConfig[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function FilterBar({ filters, searchValue, onSearchChange, searchPlaceholder }: FilterBarProps) {
  return (
    <div className={styles.bar}>
      {onSearchChange && (
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={searchPlaceholder ?? 'Buscar...'}
            value={searchValue ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Buscar"
          />
        </div>
      )}
      {filters.map((filter) => (
        <div key={filter.key} className={styles.selectWrapper}>
          <select
            className={styles.select}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            aria-label={filter.label}
            id={`filter-${filter.key}`}
          >
            <option value="all">{filter.label}: Todos</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
