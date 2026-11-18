import { describe, expect, it } from 'vitest';
import type { WasteAlertDetail } from '../types';
import { alertFillRanges, fillRangeLabel, formatAlertAverage, sortAlertDetails, visibleStationTrips } from '../utils/dashboardPresentation';

const detail = (id: string, priority: string, zone = 'Flores', fillRange = '40-60'): WasteAlertDetail => ({
  id, priority, zone, fillRange, alerts: 2, resolved: 1, alertType: 'LLENO', avgResolutionTime: 676.213956,
});

describe('dashboard presentation', () => {
  it('hides stations with at most three trips by default but includes them in name searches', () => {
    const rows = [{ station: 'Flores', cantidadViajes: 2 }, { station: 'Chacarita', cantidadViajes: 3 },
      { station: 'Constitución', cantidadViajes: 8 }];
    expect(visibleStationTrips(rows, '')).toEqual([rows[2]]);
    expect(visibleStationTrips(rows, 'flores')).toEqual([rows[0]]);
    expect(visibleStationTrips(rows, 'C')).toEqual([rows[1], rows[2]]);
    expect(visibleStationTrips(rows, 'constitucion')).toEqual([rows[2]]);
  });

  it('orders critical, high, medium and low alerts without mutating the received rows', () => {
    const rows = [detail('b', 'BAJA'), detail('m', 'Medio'), detail('c', 'CRÍTICA'), detail('a', 'ALTA')];
    expect(sortAlertDetails(rows).map(({ id }) => id)).toEqual(['c', 'a', 'm', 'b']);
    expect(rows.map(({ id }) => id)).toEqual(['b', 'm', 'c', 'a']);
    expect(formatAlertAverage(676.213956)).toBe('676,21');
    expect(formatAlertAverage(858.258888)).toBe('858,26');
  });

  it('filters fill ranges by zone without turning missing measurements into a percentage', () => {
    const rows = [detail('known', 'ALTA'), detail('missing', 'BAJA', 'Flores', 'SIN RANGO'),
      { ...detail('other', 'MEDIA', 'Palermo', '80-100'), alerts: 5 }];
    expect(fillRangeLabel('SIN RANGO')).toBeNull();
    expect(alertFillRanges(rows, 'Flores')).toEqual([{ name: '40–60 %', value: 2 }]);
    expect(alertFillRanges(rows, null)).toEqual([{ name: '40–60 %', value: 2 }, { name: '80–100 %', value: 5 }]);
    expect(rows.reduce((sum, row) => sum + row.alerts, 0)).toBe(9);
  });
});
