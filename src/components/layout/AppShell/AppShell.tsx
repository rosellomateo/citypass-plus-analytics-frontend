// src/components/layout/AppShell/AppShell.tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { Header } from '../Header/Header';
import styles from './AppShell.module.css';

export function AppShell() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <Header />
      <main className={styles.main} id="main-content">
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
