// src/router/routes.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppShell } from '../components/layout/AppShell/AppShell';
import { NotFound } from '../pages/NotFound';
import { LoadingFullPage } from '../components/common/LoadingState/LoadingState';
import { AuthGate } from '../auth/AuthGate';
import { DefaultDashboardRedirect, RouteGuard } from '../auth/RouteGuard';
import { LoginPage } from '../pages/LoginPage';
import { isLocalPreview } from '../config/localPreview';

const AnalyticsOverview = lazy(() => import('../pages/AnalyticsOverview').then((m) => ({ default: m.AnalyticsOverview })));
const ClaimsDashboard = lazy(() => import('../pages/ClaimsDashboard').then((m) => ({ default: m.ClaimsDashboard })));
const EmergenciesDashboard = lazy(() => import('../pages/EmergenciesDashboard').then((m) => ({ default: m.EmergenciesDashboard })));
const MobilityDashboard = lazy(() => import('../pages/MobilityDashboard').then((m) => ({ default: m.MobilityDashboard })));
const CultureDashboard = lazy(() => import('../pages/CultureDashboard').then((m) => ({ default: m.CultureDashboard })));
const WasteDashboard = lazy(() => import('../pages/WasteDashboard').then((m) => ({ default: m.WasteDashboard })));
const LoginDashboard = lazy(() => import('../pages/LoginDashboard').then((m) => ({ default: m.LoginDashboard })));
const EdaDashboard = lazy(() => import('../pages/EdaDashboard').then((m) => ({ default: m.EdaDashboard })));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingFullPage />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  ...(isLocalPreview() ? [{ path: '/presentacion', element: <LoginPage presentation /> }] : []),
  {
    path: '/',
    element: <AuthGate><DefaultDashboardRedirect /></AuthGate>,
  },
  {
    path: '/',
    element: <AuthGate><AppShell /></AuthGate>,
    children: [
      {
        path: 'analytics',
        element: <RouteGuard area="overview"><SuspenseWrapper><AnalyticsOverview /></SuspenseWrapper></RouteGuard>,
      },
      {
        path: 'analytics/claims',
        element: <RouteGuard area="claims"><SuspenseWrapper><ClaimsDashboard /></SuspenseWrapper></RouteGuard>,
      },
      {
        path: 'analytics/emergencies',
        element: <RouteGuard area="emergencies"><SuspenseWrapper><EmergenciesDashboard /></SuspenseWrapper></RouteGuard>,
      },
      {
        path: 'analytics/mobility',
        element: <RouteGuard area="mobility"><SuspenseWrapper><MobilityDashboard /></SuspenseWrapper></RouteGuard>,
      },
      {
        path: 'analytics/culture',
        element: <RouteGuard area="culture"><SuspenseWrapper><CultureDashboard /></SuspenseWrapper></RouteGuard>,
      },
      {
        path: 'analytics/waste',
        element: <RouteGuard area="waste"><SuspenseWrapper><WasteDashboard /></SuspenseWrapper></RouteGuard>,
      },
      {
        path: 'analytics/login',
        element: <RouteGuard area="login"><SuspenseWrapper><LoginDashboard /></SuspenseWrapper></RouteGuard>,
      },
      {
        path: 'analytics/dap',
        element: <Navigate to="/analytics/login" replace />,
      },
      {
        path: 'analytics/eda',
        element: <RouteGuard area="eda"><SuspenseWrapper><EdaDashboard /></SuspenseWrapper></RouteGuard>,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
