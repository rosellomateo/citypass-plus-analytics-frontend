// src/components/common/DataTable/DataTable.tsx
import type { ReactNode } from 'react';
import { EmptyState } from '../EmptyState/EmptyState';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: string;
  label: string;
  width?: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  maxHeight?: number;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  onRowClick,
  emptyMessage,
  maxHeight,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <EmptyState description={emptyMessage ?? 'No hay registros disponibles.'} />;
  }

  return (
    <div className={styles.wrapper} style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
      <table className={styles.table} role="table">
        <thead className={styles.thead}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={styles.th}
                style={col.width ? { width: col.width } : undefined}
                scope="col"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={String(row[keyField])}
              className={`${styles.tr} ${onRowClick ? styles.clickable : ''}`}
              onClick={() => onRowClick?.(row)}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={(e) => e.key === 'Enter' && onRowClick?.(row)}
              role={onRowClick ? 'button' : 'row'}
            >
              {columns.map((col) => (
                <td key={col.key} className={styles.td}>
                  {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
