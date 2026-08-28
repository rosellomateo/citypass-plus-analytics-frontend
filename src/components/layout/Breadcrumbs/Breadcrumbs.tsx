// src/components/layout/Breadcrumbs/Breadcrumbs.tsx
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import styles from './Breadcrumbs.module.css';

const LABEL_MAP: Record<string, string> = {
  analytics: 'Analítica Urbana',
  claims: 'Reclamos',
  emergencies: 'Emergencias',
  mobility: 'Movilidad',
  culture: 'Espacios Públicos y Cultura',
  waste: 'Residuos',
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const label = LABEL_MAP[segment] ?? segment;
    const isLast = index === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav className={styles.breadcrumbs} aria-label="Miga de pan">
      <Link to="/analytics" className={styles.crumb}>
        Inicio
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className={styles.crumbGroup}>
          <ChevronRight size={13} className={styles.separator} />
          {crumb.isLast ? (
            <span className={styles.crumbActive}>{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className={styles.crumb}>
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
