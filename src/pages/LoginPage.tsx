import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowRight, BarChart3, Bike, CircleAlert, Eye, EyeOff, KeyRound,
  MessageSquare, Network, Trees, Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authenticatePresentationTeam, authenticateWithIdp, getAuthSnapshot, getPresentationUsernames } from '../auth/session';
import type { LoginResult } from '../auth/session';
import { getDefaultAuthorizedPath, LOGIN_TEAMS } from '../auth/authorization';
import { isLocalPreview } from '../config/localPreview';
import { useAsync } from '../hooks/useAsync';
import styles from './LoginPage.module.css';

const LOGIN_ERRORS = {
  rejected: 'No pudimos iniciar sesión. Revisá tus datos e intentá nuevamente.',
  unavailable: 'No pudimos comunicarnos con Login Federado. Intentá nuevamente.',
  'analytics-unavailable': 'No pudimos confirmar tu sesión con el backend de Analítica. Intentá nuevamente.',
  'invalid-token': 'No pudimos validar tu acceso para este portal.',
  unconfigured: 'La sesión local de este equipo no está disponible.',
};

const TEAM_ICONS = {
  overview: BarChart3,
  eda: Network,
  login: KeyRound,
  emergencies: CircleAlert,
  culture: Trees,
  mobility: Bike,
  claims: MessageSquare,
  waste: Trash2,
};

export function LoginPage({ presentation = false }: { presentation?: boolean }) {
  const isPresentation = presentation && isLocalPreview();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<{ source: string; message: string }>();
  const [pending, setPending] = useState<string>();
  const submitting = useRef(false);
  const isSubmitting = pending !== undefined;
  const { data: presentationUsernames } = useAsync(
    () => isPresentation ? getPresentationUsernames() : Promise.resolve(null), [isPresentation],
  );

  async function signIn(source: string, request: () => Promise<LoginResult>) {
    if (submitting.current) return;
    submitting.current = true;
    setError(undefined);
    setPending(source);
    const result = await request();
    setPassword('');
    submitting.current = false;
    setPending(undefined);

    if (result !== 'success') {
      setError({ source, message: LOGIN_ERRORS[result] });
      return;
    }

    const session = getAuthSnapshot();
    const path = session.status === 'authenticated' ? getDefaultAuthorizedPath(session.dashboards, session.initialDashboard) : undefined;
    navigate(path ?? '/', { replace: true });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password) return;
    void signIn('manual', () => authenticateWithIdp(username.trim(), password));
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

            {error?.source === 'manual' && <p className={styles.error} role="alert">{error.message}</p>}

            <button className={styles.submit} type="submit" disabled={isSubmitting || !username.trim() || !password}>
              {pending === 'manual' ? 'Verificando acceso…' : 'Iniciar sesión'}
              <ArrowRight size={21} aria-hidden="true" />
            </button>
          </form>
        </section>

        {isPresentation && (
          <section className={styles.teamSection} aria-labelledby="quick-sign-in">
            <h2 id="quick-sign-in">Demo · Entrar sin contraseña</h2>
            <div className={styles.teamGrid}>
              {LOGIN_TEAMS.map(({ area, label }) => {
                const Icon = TEAM_ICONS[area];
                const account = presentationUsernames?.[area];
                return (
                  <button
                    key={area}
                    type="button"
                    className={styles.quickAccess}
                    disabled={isSubmitting}
                    onClick={() => void signIn(area, () => authenticatePresentationTeam(area))}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>
                      <strong>{pending === area ? 'Verificando…' : label}</strong>
                      {account && <span className={styles.account}>{account}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            {error && error.source !== 'manual' && <p className={styles.error} role="alert">{error.message}</p>}
          </section>
        )}
      </div>
    </main>
  );
}
