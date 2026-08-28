// src/hooks/useAsync.ts
// Hook base reutilizable para manejo de estado async
// Todos los hooks de dominio se construyen sobre este

import { useState, useEffect, useCallback, useRef } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[]
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  // Usamos counter para forzar re-ejecución en refetch
  const [refetchCount, setRefetchCount] = useState(0);

  // Ref para cancelar efectos stale
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    fn()
      .then((data) => {
        if (!cancelled && isMounted.current) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled && isMounted.current) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Error desconocido',
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refetchCount]);

  const refetch = useCallback(() => {
    setRefetchCount((c) => c + 1);
  }, []);

  return { ...state, refetch };
}
