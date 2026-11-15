// src/components/layout/AppShell/AppShell.tsx
import { Outlet } from 'react-router-dom';
import { Badge, Group } from '@mantine/core';
import { isLocalPreview } from '../../../config/localPreview';
import { DemoScenarioSelect } from '../../common/DemoScenarioSelect';
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
          {isLocalPreview() && (
            <Group className={styles.demo} justify="space-between">
              <Badge variant="light" color="blue">
                {import.meta.env.MODE === 'presentation' ? 'Presentación · Datos de ejemplo' : 'Vista previa · Datos de ejemplo'}
              </Badge>
              <DemoScenarioSelect />
            </Group>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
