// src/components/layout/Header/Header.tsx
import { Search, Bell } from 'lucide-react';
import styles from './Header.module.css';
import { useSyncExternalStore } from 'react';
import { getAuthSnapshot, subscribeToAuth } from '../../../auth/session';

export function Header() {
  const snapshot = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getAuthSnapshot);
  const username = snapshot.status === 'authenticated' ? snapshot.claims.preferred_username : 'Analítica Urbana';
  const module = snapshot.status === 'authenticated' ? snapshot.claims.module : 'Analista';
  return (
    <header className={styles.header} role="banner">
      <div className={styles.left}>
        <div className={styles.searchWrapper}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar dominios, eventos, zonas..."
            aria-label="Búsqueda global"
          />
        </div>
      </div>

      <div className={styles.right}>
        <button
          className={styles.notifButton}
          aria-label="Notificaciones"
          id="notifications-btn"
        >
          <Bell size={18} />
          <span className={styles.notifBadge} aria-label="3 notificaciones pendientes" />
        </button>

        <div className={styles.divider} />

        <div className={styles.userArea}>
          <div className={styles.avatar} aria-hidden="true">AU</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{username}</span>
            <span className={styles.userRole}>{module}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
