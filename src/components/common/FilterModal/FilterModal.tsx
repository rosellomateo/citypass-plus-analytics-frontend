// src/components/common/FilterModal/FilterModal.tsx
import { useState } from 'react';
import { SlidersHorizontal, X, Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { DashboardFilters } from '../../../types';
import styles from './FilterModal.module.css';

interface FilterModalProps {
  filters: DashboardFilters;
  onUpdateFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  domainOptions?: { value: string; label: string }[];
  eventTypeOptions?: { value: string; label: string }[];
}

export function FilterModal({
  filters,
  onUpdateFilter,
  domainOptions = [],
  eventTypeOptions = [],
}: FilterModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(2); // Sept 2

  const handlePeriodClick = (range: DashboardFilters['dateRange']) => {
    onUpdateFilter('dateRange', range);
  };

  return (
    <>
      <button
        type="button"
        className={styles.triggerBtn}
        onClick={() => setIsOpen(true)}
        title="Abrir filtros"
        aria-label="Abrir panel de filtros"
      >
        <SlidersHorizontal size={20} />
      </button>

      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.titleGroup}>
                <h3 className={styles.title}>Filtros</h3>
                <span className={styles.subtitle}>Acotá todos los resultados</span>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar filtros"
              >
                <X size={18} />
              </button>
            </div>

            <hr className={styles.divider} />

            {/* Período */}
            <div className={styles.section}>
              <h4 className={styles.sectionLabel}>Período</h4>
              <div className={styles.periodGrid}>
                <button
                  type="button"
                  className={`${styles.periodBtn} ${filters.dateRange === 'today' ? styles.periodBtnActive : ''}`}
                  onClick={() => handlePeriodClick('today')}
                >
                  Día
                </button>
                <button
                  type="button"
                  className={`${styles.periodBtn} ${filters.dateRange === '7d' ? styles.periodBtnActive : ''}`}
                  onClick={() => handlePeriodClick('7d')}
                >
                  Semana
                </button>
                <button
                  type="button"
                  className={`${styles.periodBtn} ${filters.dateRange === '30d' ? styles.periodBtnActive : ''}`}
                  onClick={() => handlePeriodClick('30d')}
                >
                  Mes
                </button>
                <button
                  type="button"
                  className={`${styles.periodBtn} ${filters.dateRange === 'custom' ? styles.periodBtnActive : ''}`}
                  onClick={() => handlePeriodClick('custom')}
                >
                  Mes anterior
                </button>
              </div>

              {/* Accordion Fecha */}
              <button
                type="button"
                className={`${styles.accordionBtn} ${showDatePicker ? styles.accordionBtnActive : ''}`}
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <Calendar size={18} />
                <span>Fecha</span>
                {showDatePicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showDatePicker && (
                <div className={styles.datePickerBox}>
                  <div className={styles.rangeInputs}>
                    <div className={styles.rangeLabel}>
                      <span>Desde</span>
                      <span className={styles.rangeValue}>{selectedDay ? `0${selectedDay}/09/2026` : 'Elegir'}</span>
                    </div>
                    <span className={styles.arrow}>→</span>
                    <div className={styles.rangeLabel}>
                      <span>Hasta</span>
                      <span className={styles.rangeValue}>02/09/2026</span>
                    </div>
                  </div>

                  <div className={styles.monthHeader}>
                    <button type="button" className={styles.navNavBtn}>
                      <ChevronLeft size={16} />
                    </button>
                    <span className={styles.monthTitle}>Septiembre De 2026</span>
                    <button type="button" className={styles.navNavBtn}>
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className={styles.weekDaysGrid}>
                    <span>Lu</span>
                    <span>Ma</span>
                    <span>Mi</span>
                    <span>Ju</span>
                    <span>Vi</span>
                    <span>Sá</span>
                    <span>Do</span>
                  </div>

                  <div className={styles.daysGrid}>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                      <button
                        key={day}
                        type="button"
                        className={`${styles.dayCell} ${selectedDay === day ? styles.dayCellActive : ''}`}
                        onClick={() => setSelectedDay(day)}
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={styles.applyBtn}
                    onClick={() => {
                      onUpdateFilter('dateRange', 'custom');
                      setShowDatePicker(false);
                    }}
                  >
                    <Check size={16} /> Aplicar período
                  </button>
                </div>
              )}
            </div>

            {/* Dominio */}
            {domainOptions.length > 0 && (
              <div className={styles.section}>
                <h4 className={styles.sectionLabel}>Dominio</h4>
                <select
                  className={styles.selectInput}
                  value={filters.domain ?? 'all'}
                  onChange={(e) => onUpdateFilter('domain', e.target.value as any)}
                >
                  <option value="all">Todos los dominios</option>
                  {domainOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tipo de Evento */}
            {eventTypeOptions.length > 0 && (
              <div className={styles.section}>
                <h4 className={styles.sectionLabel}>Tipo de Evento</h4>
                <select
                  className={styles.selectInput}
                  value={filters.category ?? 'all'}
                  onChange={(e) => onUpdateFilter('category', e.target.value)}
                >
                  <option value="all">Todos los tipos de evento</option>
                  {eventTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <p className={styles.footerNote}>Todos los indicadores corresponden a estos filtros.</p>
          </div>
        </div>
      )}
    </>
  );
}
