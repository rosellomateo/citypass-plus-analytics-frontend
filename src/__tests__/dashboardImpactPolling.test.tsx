import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyticsApi } from '../api/analyticsApi';
import { ApiError } from '../api/client';
import { useDashboardImpact } from '../hooks/useDashboardImpact';

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv('VITE_DATA_SOURCE', 'api');
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('polling de indicadores de parte 2', () => {
  it('no repite un 404 y vuelve a refrescar después de un reintento exitoso', async () => {
    const request = vi.spyOn(analyticsApi, 'getCrossModuleMetrics')
      .mockRejectedValue(new ApiError(404));
    const { result } = renderHook(() => useDashboardImpact('culture'));
    await act(async () => {});
    expect(result.current.error).toContain('404');
    await act(async () => { await vi.advanceTimersByTimeAsync(45_000); });
    expect(request).toHaveBeenCalledTimes(1);

    request.mockResolvedValue({ fecha_snapshot: null, datos: [] });
    await act(async () => { result.current.refetch(); });
    expect(result.current.error).toBeNull();
    expect(request).toHaveBeenCalledTimes(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('mantiene el último corte y reintenta fallos transitorios sin inventar valores', async () => {
    const report = { fecha_snapshot: '2026-11-16', datos: [{ id: 'c1', valor: 7 }] };
    const request = vi.spyOn(analyticsApi, 'getCrossModuleMetrics')
      .mockResolvedValueOnce(report).mockRejectedValueOnce(new ApiError(503))
      .mockResolvedValue(report);
    const { result } = renderHook(() => useDashboardImpact('mobility'));
    await act(async () => {});
    expect(result.current.data).toEqual(report);
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(result.current.data).toEqual(report);
    expect(result.current.error).toContain('503');
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(request).toHaveBeenCalledTimes(3);
    expect(result.current.error).toBeNull();
  });

  it('un 404 de Cultura no bloquea las consultas ni el refresco de Movilidad', async () => {
    const request = vi.spyOn(analyticsApi, 'getCrossModuleMetrics')
      .mockRejectedValueOnce(new ApiError(404))
      .mockResolvedValue({ fecha_snapshot: null, datos: [] });
    const { rerender } = renderHook(({ area }) => useDashboardImpact(area), {
      initialProps: { area: 'culture' as 'culture' | 'mobility' },
    });
    await act(async () => {});
    await act(async () => { rerender({ area: 'mobility' }); });
    expect(request.mock.calls.map(([area]) => area)).toEqual(['culture', 'mobility']);
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(request.mock.calls.map(([area]) => area)).toEqual(['culture', 'mobility', 'mobility']);
  });
});
