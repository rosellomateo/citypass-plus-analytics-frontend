// src/components/layout/AppShell/AppShell.tsx
import { Outlet } from 'react-router-dom';
import { Badge } from '@mantine/core';
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
          {import.meta.env.VITE_DATA_SOURCE === 'mock' && (
            <Badge className={styles.demo} variant="light" color="blue">Vista previa · Datos de ejemplo</Badge>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
