# CityPass+ Analytics Frontend

Aplicación web de tableros analíticos de CityPass+, construida con React,
TypeScript y Vite. Puede funcionar con datos locales de prueba o consumir la API
de analítica sin cambiar la lógica de las pantallas.

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

### Modo pruebas (sin backend)

Para ver y probar los gráficos sin levantar la API, ejecutar:

```bash
npm run dev:mock
```

Abrir <http://127.0.0.1:5174>. La vista previa local empieza en el login.
Los accesos rápidos usan datos de ejemplo y muestran los tableros del equipo
elegido. Vite refleja los cambios al guardar. Para cerrar
la vista previa, usar `Ctrl+C` en la terminal donde se inició.

Los seis casos de la Parte 2 se pueden ensayar con **Simular escenario** en
los tableros. La vista previa lee sus archivos locales en `testingDatos/`
cuando están disponibles.

### Presentación local por equipo

`npm run dev:presentation` abre <http://127.0.0.1:5175/login> con ocho accesos
rápidos para ensayar los permisos y ver datos de ejemplo. Consultá la
[configuración de las sesiones locales](docs/configuration.md#modo-presentación).

Para generar una versión estática de demostración, sin dependencia del backend:

```bash
npm run build:mock
npm run preview
```

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
npm run dev:mock
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

En modo API, el portal pide el token a Login Federado y consulta
`GET /auth/session` en Analítica antes de habilitar los tableros. Los tokens
se conservan en memoria. Consultar el [registro JWT](docs/jwt-security-record.md).

## Tecnologías principales

- React 19 y React Router
- TypeScript 6 y Vite 8
- Mantine, Recharts y Leaflet
- Vitest y Testing Library
- Oxlint
- Docker y Nginx
