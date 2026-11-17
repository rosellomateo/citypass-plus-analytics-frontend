import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authenticateWithIdp, getAuthSnapshot } from '../auth/session';
import type { LoginResult } from '../auth/session';
import { getDefaultAuthorizedPath } from '../auth/authorization';
import styles from './LoginPage.module.css';

const LOGIN_ERRORS = {
  rejected: 'No pudimos iniciar sesión. Revisá tus datos e intentá nuevamente.',
  unavailable: 'No pudimos comunicarnos con Login Federado. Intentá nuevamente.',
  'profile-unavailable': 'No pudimos consultar tu perfil en Login Federado. Intentá nuevamente.',
  'invalid-token': 'No pudimos validar tu acceso para este portal.',
};

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  async function signIn(request: () => Promise<LoginResult>) {
    if (submitting.current) return;
    submitting.current = true;
    setError(undefined);
    setIsSubmitting(true);
    const result = await request();
    setPassword('');
    submitting.current = false;
    setIsSubmitting(false);

    if (result !== 'success') {
      setError(LOGIN_ERRORS[result]);
      return;
    }

    const session = getAuthSnapshot();
    const path = session.status === 'authenticated' ? getDefaultAuthorizedPath(session.dashboards, session.initialDashboard) : undefined;
    navigate(path ?? '/', { replace: true });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password) return;
    void signIn(() => authenticateWithIdp(username.trim(), password));
  }

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.card} aria-labelledby="login-title">
          <header className={styles.brandHeader}>
            <div className={styles.brandLine}>CityPass<span>+</span></div>
            <h1 id="login-title">Bienvenido</h1>
            <p>Acceso al portal de Analítica Urbana.</p>
          </header>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="username">Nombre de usuario</label>
              <input
                id="username"
                name="username"
                autoComplete="username"
                placeholder="Tu usuario"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Contraseña</label>
              <div className={styles.passwordField}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
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
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className={styles.error} role="alert">{error}</p>}

            <button className={styles.submit} type="submit" disabled={isSubmitting || !username.trim() || !password}>
              {isSubmitting ? 'Verificando acceso…' : 'Iniciar sesión'}
              <ArrowRight size={21} aria-hidden="true" />
            </button>
          </form>
        </section>

      </div>
    </main>
  );
}
