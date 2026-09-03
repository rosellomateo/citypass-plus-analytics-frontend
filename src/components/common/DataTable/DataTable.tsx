// src/components/common/DataTable/DataTable.tsx
import { useState, useEffect, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  pageSize?: number;
}

export function DataTable<T extends object>({
  columns,
  data,
  keyField,
  onRowClick,
  emptyMessage,
  maxHeight,
  pageSize = 10,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 if data or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, pageSize]);

  if (data.length === 0) {
    return <EmptyState description={emptyMessage ?? 'No hay registros disponibles.'} />;
  }

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const displayedData = data.slice(startIndex, endIndex);

  return (
    <div className={styles.container}>
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
            {displayedData.map((row) => (
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
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalItems > pageSize && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Mostrando {startIndex + 1}-{endIndex} de {totalItems} datos
          </span>
          <div className={styles.paginationControls}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={validPage === 1}
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
              <span>Anterior</span>
            </button>
            <span className={styles.pageNumber}>
              Página {validPage} de {totalPages}
            </span>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={validPage === totalPages}
              aria-label="Página siguiente"
            >
              <span>Siguiente</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

