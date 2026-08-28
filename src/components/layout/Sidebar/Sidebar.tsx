// src/components/layout/Sidebar/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Siren,
  Bike,
  Calendar,
  Trash2,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { label: 'Resumen', path: '/analytics', icon: <LayoutDashboard size={17} />, exact: true },
  { label: 'Reclamos', path: '/analytics/claims', icon: <FileText size={17} /> },
  { label: 'Emergencias', path: '/analytics/emergencies', icon: <Siren size={17} /> },
  { label: 'Movilidad', path: '/analytics/mobility', icon: <Bike size={17} /> },
  { label: 'Espacios Públicos y Cultura', path: '/analytics/culture', icon: <Calendar size={17} /> },
  { label: 'Residuos (Pendiente)', path: '/analytics/waste', icon: <Trash2 size={17} />, isPending: true },
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar} role="navigation" aria-label="Navegación Analítica Urbana">
      {/* Logo */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 22V12h6v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className={styles.logoText}>
          CityPass<span className={styles.logoPlus}>+</span>
        </span>
      </div>

      {/* Navegación */}
      <nav className={styles.navSection}>
        <div className={styles.sectionLabel}>ANALÍTICA URBANA</div>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''} ${item.isPending ? styles.pendingItem : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
