// src/hooks/useUiState.ts
// Lee el query param ?uiState=loading|error|empty para testing de estados en dev

import { useSearchParams } from 'react-router-dom';
import type { UiState } from '../types';

export function useUiStateOverride(): UiState | null {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get('uiState') as UiState | null;
  if (raw && ['loading', 'error', 'empty', 'success'].includes(raw)) {
    return raw;
  }
  return null;
}

/**
 * Combina el estado async real con el override de dev.
 * Si hay override, devuelve el estado forzado.
 */
export function useResolvedUiState<T>(
  asyncState: { data: T | null; loading: boolean; error: string | null }
): { data: T | null; loading: boolean; error: string | null; isEmpty: boolean } {
  const override = useUiStateOverride();

  if (override === 'loading') {
    return { data: null, loading: true, error: null, isEmpty: false };
  }
  if (override === 'error') {
    return { data: null, loading: false, error: 'Error simulado para testing.', isEmpty: false };
  }
  if (override === 'empty') {
    return { data: null, loading: false, error: null, isEmpty: true };
  }

  const isEmpty =
    !asyncState.loading &&
    !asyncState.error &&
    (asyncState.data === null ||
      (Array.isArray(asyncState.data) && asyncState.data.length === 0));

  return { ...asyncState, isEmpty };
}
