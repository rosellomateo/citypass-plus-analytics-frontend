import { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { getAuthSnapshot, subscribeToAuth } from './session';

function AccessDenied() {
  return <main role="alert" style={{ maxWidth: 640, margin: '5rem auto', padding: '0 1.5rem' }}>
    <h1>Acceso no disponible</h1>
    <p>Tu sesión no es válida, expiró o no tiene acceso a Analítica Urbana.</p>
    <p>Volvé a iniciar sesión desde CityPass+.</p>
  </main>;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getAuthSnapshot);
  return snapshot.status === 'disabled' || snapshot.status === 'authenticated' ? <>{children}</> : <AccessDenied />;
}
