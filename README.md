# CityPass+ Analytics Frontend

Aplicación web de tableros analíticos de CityPass+, construida con React,
TypeScript y Vite. El portal consume la API de Analítica con una sesión de Login Federado.

## Inicio rápido

Requisitos: Node.js 22 y npm.

```bash
git clone https://github.com/rosellomateo/citypass-plus-analytics-frontend.git
cd citypass-plus-analytics-frontend
npm ci
cp .env.example .env.local
npm run dev
```

La configuración de ejemplo usa la API de Analítica. Abrir <http://localhost:5173>.

Para una prueba integrada, editar `.env.local`:

```dotenv
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=http://localhost:8000
```

Reiniciar Vite después de cambiar variables de entorno. En modo `api`, el
backend debe estar disponible y permitir por CORS el origen del frontend.

## Comandos principales

```bash
npm run dev
npm run lint
npm run test
npm run test:coverage
npm run build
npm run preview
```

## Documentación

- [Arquitectura y flujo de datos](docs/architecture.md)
- [Configuración y modos de datos](docs/configuration.md)
- [Integración con el backend](docs/backend-integration.md)
- [Guía de desarrollo](docs/development.md)
- [Pruebas y controles de calidad](docs/testing.md)
- [Uso con Docker](docs/docker.md)
- [Despliegue y CI/CD](docs/deployment.md)

## Estado de seguridad

En modo API, el portal usa el cliente de Analítica `citypass-analitica-web`, configurable en `VITE_AUTH_CLIENT_ID`,
y consulta `GET /me` de Login/LDAP antes de habilitar los tableros. Los tokens
se conservan en memoria. Consultar el [registro JWT](docs/jwt-security-record.md).

## Tecnologías principales

- React 19 y React Router
- TypeScript 6 y Vite 8
- Mantine, Recharts y Leaflet
- Vitest y Testing Library
- Oxlint
- Docker y Nginx
