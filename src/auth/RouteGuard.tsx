import { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { canAccessArea, getDefaultAuthorizedPath, hasAnyAnalyticsAccess } from './authorization';
import type { ProtectedArea } from './authorization';
import { getAuthSnapshot, subscribeToAuth } from './session';

function NoAccess() {
  return <main role="alert" style={{ maxWidth: 640, margin: '5rem auto', padding: '0 1.5rem' }}>
    <h1>Sin accesos asignados</h1>
    <p>Tu sesión es válida, pero no pertenecés a un grupo con acceso a este panel.</p>
    <p>Pedile a la persona delegada de tu módulo que revise tus grupos.</p>
  </main>;
}

export function DefaultDashboardRedirect() {
  const snapshot = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getAuthSnapshot);
  if (snapshot.status === 'disabled') return <Navigate to="/analytics" replace />;
  const path = snapshot.status === 'authenticated' ? getDefaultAuthorizedPath(snapshot.claims) : undefined;
  return path ? <Navigate to={path} replace /> : <NoAccess />;
}

export function RouteGuard({ area, children }: { area: ProtectedArea; children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getAuthSnapshot);
  if (snapshot.status === 'disabled') return <>{children}</>;
  if (snapshot.status !== 'authenticated' || !hasAnyAnalyticsAccess(snapshot.claims)) return <NoAccess />;
  if (canAccessArea(snapshot.claims, area)) return <>{children}</>;
  return <Navigate to={getDefaultAuthorizedPath(snapshot.claims) ?? '/'} replace />;
}
