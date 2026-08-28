// src/utils/index.ts
// Barrel export de utils

export { delay, MOCK_DELAY } from './delay';
export {
  filterByDateRange,
  filterByZone,
  filterByStatus,
  filterByCategory,
  filterBySeverity,
  filterByDomain,
  filterBySearch,
} from './filters';
export {
  getDateRangeBounds,
  isWithinDateRange,
  formatTimestamp,
  formatTime,
  formatDate,
  generateTimeSeries,
} from './dates';
export {
  formatNumber,
  formatPct,
  formatVariation,
  formatLatency,
  formatDuration,
  truncate,
  capitalize,
} from './formatters';
