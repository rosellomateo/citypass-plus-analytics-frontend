import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useDashboardImpact } from '../hooks/useDashboardImpact';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it('does not request or poll cross-module data absent from the injected embed payload', async () => {
  vi.stubEnv('VITE_DATA_SOURCE', 'embedded');
  const fetchMock = vi.fn();
  const timer = vi.spyOn(window, 'setTimeout');
  vi.stubGlobal('fetch', fetchMock);
  const { result } = renderHook(() => useDashboardImpact('claims'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
  expect(timer.mock.calls.some(([, delay]) => delay === 15_000)).toBe(false);
});
