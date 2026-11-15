import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import '@mantine/core/styles.css';
import '../index.css';
import './styles.css';
import { theme } from '../theme/mantineTheme';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { ClaimsDashboard } from '../pages/ClaimsDashboard';
import { EmergenciesDashboard } from '../pages/EmergenciesDashboard';
import { MobilityDashboard } from '../pages/MobilityDashboard';
import { CultureDashboard } from '../pages/CultureDashboard';
import { WasteDashboard } from '../pages/WasteDashboard';
import { getEmbeddedModule, type EmbedModule } from './module';

const pages = {
  reclamos: ClaimsDashboard,
  emergencias: EmergenciesDashboard,
  movilidad: MobilityDashboard,
  espacios: CultureDashboard,
  residuos: WasteDashboard,
} satisfies Record<EmbedModule, React.ComponentType>;

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
const module = getEmbeddedModule();
const Page = module ? pages[module] : undefined;

createRoot(root).render(
  <MantineProvider theme={theme}>
    <MemoryRouter>
      {Page ? <Page /> : <ErrorCard message="Tablero desconocido" />}
    </MemoryRouter>
  </MantineProvider>
);

// El sandbox tiene origen opaco. El contenedor debe verificar event.source.
new ResizeObserver(() => {
  if (window.parent !== window) {
    window.parent.postMessage({
      tipo: 'citypass-tablero-altura',
      altura: Math.ceil(root.getBoundingClientRect().height),
    }, '*');
  }
}).observe(root);
