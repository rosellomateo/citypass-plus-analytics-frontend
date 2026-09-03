// src/components/common/DateRangeSelector/CustomDateModal.tsx
import { useState } from 'react';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import styles from './CustomDateModal.module.css';

interface CustomDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (from: string, to: string) => void;
  initialFrom?: string;
  initialTo?: string;
}

export function CustomDateModal({
  isOpen,
  onClose,
  onApply,
  initialFrom,
  initialTo,
}: CustomDateModalProps) {
  // Reference date default: Sept 2026 or current date
  const today = new Date();
  const defaultYear = today.getFullYear() < 2026 ? 2026 : today.getFullYear();
  const defaultMonth = today.getMonth(); // 0-indexed

  const [currentYear, setCurrentYear] = useState(defaultYear);
  const [currentMonth, setCurrentMonth] = useState(defaultMonth);

  const [fromDate, setFromDate] = useState<string>(
    initialFrom || `${defaultYear}-${String(defaultMonth + 1).padStart(2, '0')}-01`
  );
  const [toDate, setToDate] = useState<string>(
    initialTo || `${defaultYear}-${String(defaultMonth + 1).padStart(2, '0')}-07`
  );
  const [selectingField, setSelectingField] = useState<'from' | 'to'>('from');

  if (!isOpen) return null;

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday = 0

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const formatDateStr = (year: number, month: number, day: number) => {
    const yyyy = year;
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleDayClick = (day: number) => {
    const selected = formatDateStr(currentYear, currentMonth, day);
    if (selectingField === 'from') {
      setFromDate(selected);
      if (selected > toDate) {
        setToDate(selected);
      }
      setSelectingField('to');
    } else {
      if (selected < fromDate) {
        setFromDate(selected);
        setToDate(selected);
      } else {
        setToDate(selected);
      }
      setSelectingField('from');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromDate && toDate) {
      onApply(fromDate, toDate);
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <CalendarIcon size={20} className={styles.icon} />
            <div>
              <h3 className={styles.title}>Seleccionar Rango de Fechas</h3>
              <span className={styles.subtitle}>Elegí las fechas delimitantes para filtrar</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.inputsRow}>
            <div
              className={`${styles.inputGroup} ${selectingField === 'from' ? styles.inputActive : ''}`}
              onClick={() => setSelectingField('from')}
            >
              <label htmlFor="custom-from-date" className={styles.label}>
                Desde (Fecha Inicio)
              </label>
              <input
                id="custom-from-date"
                type="date"
                className={styles.dateInput}
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  if (e.target.value > toDate) setToDate(e.target.value);
                }}
                required
              />
            </div>
            <div className={styles.arrowSeparator}>→</div>
            <div
              className={`${styles.inputGroup} ${selectingField === 'to' ? styles.inputActive : ''}`}
              onClick={() => setSelectingField('to')}
            >
              <label htmlFor="custom-to-date" className={styles.label}>
                Hasta (Fecha Fin)
              </label>
              <input
                id="custom-to-date"
                type="date"
                className={styles.dateInput}
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  if (e.target.value < fromDate) setFromDate(e.target.value);
                }}
                required
              />
            </div>
          </div>

          <div className={styles.calendarBox}>
            <div className={styles.monthHeader}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={handlePrevMonth}
                aria-label="Mes anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <span className={styles.monthTitle}>
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                className={styles.navBtn}
                onClick={handleNextMonth}
                aria-label="Mes siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className={styles.weekHeader}>
              <span>Lu</span>
              <span>Ma</span>
              <span>Mi</span>
              <span>Ju</span>
              <span>Vi</span>
              <span>Sá</span>
              <span>Do</span>
            </div>

            <div className={styles.daysGrid}>
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className={styles.emptyCell} />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dateStr = formatDateStr(currentYear, currentMonth, day);
                const isFrom = dateStr === fromDate;
                const isTo = dateStr === toDate;
                const inRange = dateStr > fromDate && dateStr < toDate;

                return (
                  <button
                    key={day}
                    type="button"
                    className={`${styles.dayBtn} ${
                      isFrom ? styles.dayFrom : ''
                    } ${isTo ? styles.dayTo : ''} ${
                      inRange ? styles.dayInRange : ''
                    }`}
                    onClick={() => handleDayClick(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.applyBtn}>
              <Check size={16} /> Aplicar Rango
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
