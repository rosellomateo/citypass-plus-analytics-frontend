// src/components/layout/Sidebar/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import {
  Bike,
  Trash2,
  KeyRound,
  User,
  Bell,
  Settings,
  HelpCircle,
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { useSyncExternalStore } from 'react';
import { DOMAIN_NAV_ITEMS } from '../../../config/domains';
import { canAccessArea, OVERVIEW } from '../../../auth/authorization';
import type { ProtectedArea } from '../../../auth/authorization';
import { getAuthSnapshot, subscribeToAuth } from '../../../auth/session';

// Icono Reclamos: Globo de texto con signo de exclamación (!)
function ReclamosIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="12" y1="8" x2="12" y2="11.5" />
      <circle cx="12" cy="14" r="0.5" fill="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// Icono Emergencias: Escudo con signo de exclamación (!)
function EmergenciasIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <circle cx="12" cy="15" r="0.5" fill="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// Icono Espacios Públicos: Edificio con árbol
function EspaciosPublicosIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h12" />
      <path d="M5 21V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14" />
      <path d="M8 9h1" />
      <path d="M8 13h1" />
      <circle cx="17.5" cy="12" r="3" />
      <path d="M17.5 15v6" />
    </svg>
  );
}

// Icono Analítica Urbana: Gráfico de tendencia
function AnaliticaUrbanaIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 4 2 5-6" />
    </svg>
  );
}

const ICONS: Record<ProtectedArea, React.ReactNode> = {
  overview: <AnaliticaUrbanaIcon size={18} />,
  mobility: <Bike size={18} />,
  waste: <Trash2 size={18} />,
  claims: <ReclamosIcon size={18} />,
  emergencies: <EmergenciasIcon size={18} />,
  culture: <EspaciosPublicosIcon size={18} />,
  login: <KeyRound size={18} />,
};

const NAV_ITEMS = [OVERVIEW, ...DOMAIN_NAV_ITEMS.map(({ label, path, domain }) => ({ label, path, area: domain }))];
const BOTTOM_NAV_ITEMS = [
  { label: 'Mi cuenta', path: '/account', icon: <User size={18} /> },
  { label: 'Notificaciones', path: '/notifications', icon: <Bell size={18} /> },
  { label: 'Configuracion', path: '/settings', icon: <Settings size={18} /> },
  { label: 'Ayuda', path: '/help', icon: <HelpCircle size={18} /> },
];

export function Sidebar() {
  const snapshot = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getAuthSnapshot);
  const visibleNavItems = snapshot.status === 'authenticated'
    ? NAV_ITEMS.filter((item) => canAccessArea(snapshot.dashboards, item.area))
    : NAV_ITEMS;

  return (
    <aside className={styles.sidebar} role="navigation" aria-label="Navegación Analítica Urbana">
      {/* Logo */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <svg width="24" height="28" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <clipPath id="sidebar-pin-shape">
                <path d="M 50 115 C 50 115 90 75 90 45 C 90 22.9 72.1 5 50 5 C 27.9 5 10 22.9 10 45 C 10 75 50 115 50 115 Z" />
              </clipPath>
            </defs>
            <g clipPath="url(#sidebar-pin-shape)">
              <rect x="0" y="0" width="100" height="53" fill="#2e9ee6" />
              <rect x="0" y="53" width="100" height="67" fill="#16427b" />
              <rect x="0" y="51" width="100" height="4" fill="white" />
              <rect x="22" y="41" width="8" height="10" fill="white" />
              <rect x="33" y="33" width="8" height="18" fill="white" />
              <path d="M 44 51 V 25 L 56 14 V 51 Z" fill="white" />
              <rect x="59" y="33" width="8" height="18" fill="white" />
              <rect x="70" y="41" width="8" height="10" fill="white" />
            </g>
          </svg>
        </div>
        <span className={styles.logoText}>
          CityPass<span className={styles.logoPlus}>+</span>
        </span>
      </div>

      {/* Navegación */}
      <nav className={styles.navSection}>
        <div className={styles.sectionLabel}>SERVICIOS</div>

        {visibleNavItems.map((item) => (
          <NavLink
            key={item.area}
            to={item.path}
            end
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>{ICONS[item.area]}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
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
        <svg width="240" height="40" viewBox="0 0 240 40" fill="none" className={styles.skylineSvg}>
          <circle cx="40" cy="15" r="4" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <path d="M190 18c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5c.5 0 1 .5 1 1s-.5 1-1 1h-5c-.5 0-1-.5-1-1 0-.5.5-1 1-1z" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <path
            d="M0 35h20v-12h12v6h8v-9h10v8h14v-16h12v11h15v-5h8v10h15v-8h10v11h76"
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
