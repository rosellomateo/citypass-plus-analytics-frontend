// src/utils/dateUtils.ts
import type { DashboardFilters } from '../types';

export function isDateInRange(
  dateInput: string | Date | undefined,
  filters: DashboardFilters,
  refDate: Date = new Date('2026-09-02T23:59:59Z')
): boolean {
  if (!dateInput) return true;

  const targetDate = new Date(dateInput);
  if (isNaN(targetDate.getTime())) return true;

  // Use current time or fallback reference timestamp if mock dataset is relative
  const nowTime = refDate.getTime();

  const { dateRange, from, to } = filters;

  if (dateRange === 'today') {
    // Past 24 hours or same calendar day
    const oneDayAgo = nowTime - 24 * 60 * 60 * 1000;
    return targetDate.getTime() >= oneDayAgo && targetDate.getTime() <= nowTime + 24 * 60 * 60 * 1000;
  }

  if (dateRange === '7d') {
    const sevenDaysAgo = nowTime - 7 * 24 * 60 * 60 * 1000;
    return targetDate.getTime() >= sevenDaysAgo && targetDate.getTime() <= nowTime + 24 * 60 * 60 * 1000;
  }

  if (dateRange === '30d') {
    const thirtyDaysAgo = nowTime - 30 * 24 * 60 * 60 * 1000;
    return targetDate.getTime() >= thirtyDaysAgo && targetDate.getTime() <= nowTime + 24 * 60 * 60 * 1000;
  }

  if (dateRange === 'custom') {
    let valid = true;
    if (from) {
      const fromTime = new Date(`${from}T00:00:00`).getTime();
      if (!isNaN(fromTime)) {
        valid = valid && targetDate.getTime() >= fromTime;
      }
    }
    if (to) {
      const toTime = new Date(`${to}T23:59:59`).getTime();
      if (!isNaN(toTime)) {
        valid = valid && targetDate.getTime() <= toTime;
      }
    }
    return valid;
  }

  return true;
}

export function filterRecordsByDateRange<T>(
  records: T[],
  getDateFn: (item: T) => string | Date | undefined,
  filters: DashboardFilters,
  refDate?: Date
): T[] {
  return records.filter((item) => isDateInRange(getDateFn(item), filters, refDate));
}
