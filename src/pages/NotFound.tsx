// src/pages/NotFound.tsx
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import styles from './NotFound.module.css';

export function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.iconBox}>
        <MapPin size={40} />
      </div>
      <h1 className={styles.code}>404</h1>
      <h2 className={styles.title}>Página no encontrada</h2>
      <p className={styles.description}>
        La ruta que buscas no existe dentro del módulo de Analítica Urbana.
      </p>
      <Link to="/analytics" className={styles.btn} id="not-found-home-btn">
        Ir a Analítica Urbana
      </Link>
    </div>
  );
}
