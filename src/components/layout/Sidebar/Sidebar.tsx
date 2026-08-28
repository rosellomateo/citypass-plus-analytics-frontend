// src/components/layout/Sidebar/Sidebar.tsx
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Network,
  Trash2,
  MessageSquare,
  Shield,
  Building2,
  Ticket,
  LineChart,
  User,
  Bell,
  Settings,
  HelpCircle,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { label: 'Inicio', path: '/', icon: <Home size={17} /> },
  { label: 'Movilidad', path: '/analytics/mobility', icon: <Network size={17} /> },
  { label: 'Residuos', path: '/analytics/waste', icon: <Trash2 size={17} />, isPending: true },
  { label: 'Reclamos', path: '/analytics/claims', icon: <MessageSquare size={17} /> },
  { label: 'Emergencias', path: '/analytics/emergencies', icon: <Shield size={17} /> },
  { label: 'Espacios Publicos', path: '/analytics/culture', icon: <Building2 size={17} /> },
  { label: 'Cultura y Eventos', path: '/analytics/culture?tab=events', icon: <Ticket size={17} /> },
  { label: 'Analitica Urbana', path: '/analytics', icon: <LineChart size={17} /> },
];

const BOTTOM_NAV_ITEMS = [
  { label: 'Mi cuenta', path: '/account', icon: <User size={17} /> },
  { label: 'Notificaciones', path: '/notifications', icon: <Bell size={17} /> },
  { label: 'Configuracion', path: '/settings', icon: <Settings size={17} /> },
  { label: 'Ayuda', path: '/help', icon: <HelpCircle size={17} /> },
];

export function Sidebar() {
  const location = useLocation();

  const isItemActive = (itemPath: string) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;

    if (itemPath === '/') {
      return currentPath === '/';
    }
    if (itemPath === '/analytics') {
      return currentPath === '/analytics';
    }
    if (itemPath === '/analytics/culture') {
      return currentPath === '/analytics/culture' && !currentSearch.includes('tab=events');
    }
    if (itemPath === '/analytics/culture?tab=events') {
      return currentPath === '/analytics/culture' && currentSearch.includes('tab=events');
    }
    return currentPath === itemPath;
  };

  return (
    <aside className={styles.sidebar} role="navigation" aria-label="Navegación Analítica Urbana">
      {/* Logo */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <svg width="24" height="28" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Pin bottom tip */}
            <path d="M12 28C12 28 21 19 21 12H3C3 19 12 28 12 28Z" fill="#1B365D" />
            {/* Pin top circle */}
            <circle cx="12" cy="12" r="9" fill="#4d96c8" />
            {/* Buildings */}
            <rect x="8.5" y="11" width="1.8" height="6" fill="white" />
            <rect x="11" y="8" width="2" height="9" fill="white" />
            <rect x="13.7" y="13" width="1.8" height="4" fill="white" />
            {/* Bottom connector line */}
            <rect x="8" y="16.5" width="8" height="1" fill="white" />
          </svg>
        </div>
        <span className={styles.logoText}>
          CityPass<span className={styles.logoPlus}>+</span>
        </span>
      </div>

      {/* Navegación */}
      <nav className={styles.navSection}>
        <div className={styles.sectionLabel}>SERVICIOS</div>

        {NAV_ITEMS.map((item) => {
          const isActive = isItemActive(item.path);
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''} ${item.isPending ? styles.pendingItem : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {isActive && <span className={styles.activeBadge}>ACTIVO</span>}
            </NavLink>
          );
        })}

        <hr className={styles.divider} />

        {BOTTOM_NAV_ITEMS.map((item) => (
          <div
            key={item.label}
            className={styles.navItem}
            onClick={(e) => e.preventDefault()}
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* City Skyline Outline */}
      <div className={styles.skylineWrapper}>
        <svg width="240" height="60" viewBox="0 0 240 60" fill="none" className={styles.skylineSvg}>
          <circle cx="40" cy="25" r="5" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <path d="M190 28c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5c.5 0 1 .5 1 1s-.5 1-1 1h-5c-.5 0-1-.5-1-1 0-.5.5-1 1-1z" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <path
            d="M0 55h20v-15h12v8h8v-12h10v10h14v-22h12v15h15v-6h8v13h15v-10h10v14h76"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </aside>
  );
}
