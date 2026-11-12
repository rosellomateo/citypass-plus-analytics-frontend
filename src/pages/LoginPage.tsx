import { useState } from 'react';
import type { FormEvent } from 'react';
import { BarChart3, Eye, EyeOff, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authenticateWithIdp, getAuthSnapshot, verifySessionWithBackend } from '../auth/session';
import { getDefaultAuthorizedPath } from '../auth/authorization';
import styles from './LoginPage.module.css';

const GENERIC_LOGIN_ERROR = 'No pudimos iniciar sesión. Revisá tus datos e intentá nuevamente.';

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password) return;
    setError(undefined);
    setIsSubmitting(true);
    const result = await authenticateWithIdp(username.trim(), password);
    setPassword('');
    setIsSubmitting(false);

    if (result !== 'success') {
      setError(result === 'unavailable' ? 'El servicio de acceso no está disponible. Intentá nuevamente.' : GENERIC_LOGIN_ERROR);
      return;
    }

    const verified = await verifySessionWithBackend();
    if (!verified) {
      setError('No pudimos validar tu acceso para este portal. Intentá nuevamente.');
      return;
    }

    const session = getAuthSnapshot();
    const path = session.status === 'authenticated' ? getDefaultAuthorizedPath(session.claims) : undefined;
    navigate(path ?? '/');
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <header className={styles.brandHeader}>
          <div className={styles.brandLine}><BarChart3 aria-hidden="true" size={28} /><span>CityPass<span>+</span></span></div>
          <p>Analítica Urbana</p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <h1 id="login-title" className={styles.srOnly}>Ingresar a Analítica Urbana</h1>

          <label htmlFor="username">Usuario <span aria-hidden="true">*</span></label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={isSubmitting}
            required
          />

          <label htmlFor="password">Contraseña <span aria-hidden="true">*</span></label>
          <div className={styles.passwordField}>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              required
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <button className={styles.submit} type="submit" disabled={isSubmitting || !username.trim() || !password}>
            <LogIn size={16} />
            {isSubmitting ? 'Verificando acceso…' : 'Ingresar'}
          </button>
        </form>
        <p className={styles.notice}>Tu acceso se determina por los grupos asignados en CityPass+.</p>
      </section>
    </main>
  );
}
