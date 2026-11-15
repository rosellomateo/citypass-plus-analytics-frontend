import { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthSnapshot, subscribeToAuth } from './session';
import { LoadingFullPage } from '../components/common/LoadingState/LoadingState';

export function AuthGate({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getAuthSnapshot);
  if (snapshot.status === 'authenticated') return <>{children}</>;
  if (snapshot.status === 'verifying') return <LoadingFullPage />;
  return <Navigate to="/login" replace />;
}
