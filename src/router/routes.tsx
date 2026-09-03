// src/router/routes.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppShell } from '../components/layout/AppShell/AppShell';
import { NotFound } from '../pages/NotFound';
import { LoadingFullPage } from '../components/common/LoadingState/LoadingState';

const AnalyticsOverview = lazy(() => import('../pages/AnalyticsOverview').then((m) => ({ default: m.AnalyticsOverview })));
const ClaimsDashboard = lazy(() => import('../pages/ClaimsDashboard').then((m) => ({ default: m.ClaimsDashboard })));
const EmergenciesDashboard = lazy(() => import('../pages/EmergenciesDashboard').then((m) => ({ default: m.EmergenciesDashboard })));
const MobilityDashboard = lazy(() => import('../pages/MobilityDashboard').then((m) => ({ default: m.MobilityDashboard })));
const CultureDashboard = lazy(() => import('../pages/CultureDashboard').then((m) => ({ default: m.CultureDashboard })));
const WasteDashboard = lazy(() => import('../pages/WasteDashboard').then((m) => ({ default: m.WasteDashboard })));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingFullPage />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/analytics" replace />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        path: 'analytics',
        element: <SuspenseWrapper><AnalyticsOverview /></SuspenseWrapper>,
      },
      {
        path: 'analytics/claims',
        element: <SuspenseWrapper><ClaimsDashboard /></SuspenseWrapper>,
      },
      {
        path: 'analytics/emergencies',
        element: <SuspenseWrapper><EmergenciesDashboard /></SuspenseWrapper>,
      },
      {
        path: 'analytics/mobility',
        element: <SuspenseWrapper><MobilityDashboard /></SuspenseWrapper>,
      },
      {
        path: 'analytics/culture',
        element: <SuspenseWrapper><CultureDashboard /></SuspenseWrapper>,
      },
      {
        path: 'analytics/waste',
        element: <SuspenseWrapper><WasteDashboard /></SuspenseWrapper>,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
