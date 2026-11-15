// src/components/layout/Breadcrumbs/Breadcrumbs.tsx
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { getAuthSnapshot, subscribeToAuth } from '../../../auth/session';
import { getDefaultAuthorizedPath, OVERVIEW } from '../../../auth/authorization';
import { DOMAIN_NAV_ITEMS } from '../../../config/domains';
import styles from './Breadcrumbs.module.css';

export function Breadcrumbs() {
  const location = useLocation();
  const snapshot = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getAuthSnapshot);
  const dashboard = DOMAIN_NAV_ITEMS.find((item) => item.path === location.pathname);
  const authorizedHome = snapshot.status === 'authenticated' ? getDefaultAuthorizedPath(snapshot.dashboards) : OVERVIEW.path;

  if (!dashboard || authorizedHome !== OVERVIEW.path) return null;

  return (
    <nav className={styles.breadcrumbs} aria-label="Miga de pan">
      <Link to={OVERVIEW.path} className={styles.crumb}>
        {OVERVIEW.label}
      </Link>
      <span className={styles.crumbGroup}>
        <ChevronRight size={13} className={styles.separator} />
        <span className={styles.crumbActive} aria-current="page">{dashboard.label}</span>
      </span>
    </nav>
  );
}
