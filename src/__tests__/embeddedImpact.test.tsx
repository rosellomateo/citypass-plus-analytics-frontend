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

function injectPayload(module: string, payload: unknown) {
  document.documentElement.dataset.modulo = module;
  const script = document.createElement('script');
  script.id = 'citypass-datos';
  script.type = 'application/json';
  script.textContent = JSON.stringify(payload);
  document.body.appendChild(script);
}

afterEach(() => {
  document.getElementById('citypass-datos')?.remove();
  delete document.documentElement.dataset.modulo;
});

it('reads Parte 2 from the injected payload without requesting or polling', async () => {
  vi.stubEnv('VITE_DATA_SOURCE', 'embedded');
  const fetchMock = vi.fn();
  const timer = vi.spyOn(window, 'setTimeout');
  vi.stubGlobal('fetch', fetchMock);
  const parte2 = { fecha_snapshot: '2026-11-17', datos: [{ id: 'c5', valor: 1, detalle: [] }] };
  injectPayload('residuos', { datos: [], informe: {}, parte2 });
  const { result } = renderHook(() => useDashboardImpact('waste'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toEqual(parte2);
  expect(fetchMock).not.toHaveBeenCalled();
  expect(timer.mock.calls.some(([, delay]) => delay === 15_000)).toBe(false);
});

it('ignores Parte 2 injected for another module', async () => {
  vi.stubEnv('VITE_DATA_SOURCE', 'embedded');
  injectPayload('reclamos', { datos: [], informe: {}, parte2: { datos: [{ id: 'c5', valor: 1 }] } });
  const { result } = renderHook(() => useDashboardImpact('waste'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toBeNull();
});

it('keeps working with payloads from a backend without Parte 2', async () => {
  vi.stubEnv('VITE_DATA_SOURCE', 'embedded');
  injectPayload('emergencias', { datos: [], informe: {} });
  const { result } = renderHook(() => useDashboardImpact('emergencies'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toBeNull();
});
