import { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthSnapshot, subscribeToAuth } from './session';

export function AuthGate({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getAuthSnapshot);
  if (snapshot.status === 'disabled' || snapshot.status === 'authenticated') return <>{children}</>;
  return <Navigate to="/login" replace />;
}
