// src/components/layout/Header/Header.tsx
import { Search, Bell } from 'lucide-react';
import styles from './Header.module.css';

export function Header() {
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
            <span className={styles.userName}>Analítica Urbana</span>
            <span className={styles.userRole}>Analista</span>
          </div>
        </div>
      </div>
    </header>
  );
}
