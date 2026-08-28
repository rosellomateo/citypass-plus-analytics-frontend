// src/types/common.ts
import type { Domain } from './domain';

export interface EventEnvelope<T = Record<string, unknown>> {
  metadata: {
    eventId: string;
    eventType: string;
    occurredAt: string; // ISO-8601 UTC
    source: string;
    version: string;
  };
  data: T & {
    correlationId?: string;
  };
}

export interface Metric {
  label: string;
  value: number | string;
  unit?: string;
  sublabel?: string;
  status?: 'normal' | 'warning' | 'critical' | 'info';
}

export interface TimeSeriesPoint {
  label: string;
  value: number;
}

export interface DashboardFilters {
  dateRange: 'today' | '7d' | '30d' | 'custom';
  from?: string;
  to?: string;
  domain?: Domain;
  search?: string;
}

export type UiState = 'success' | 'loading' | 'error' | 'empty';
