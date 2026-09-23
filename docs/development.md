# Guía de desarrollo

## Requisitos

- Git.
- Node.js 22.
- npm, incluido con Node.js.

## Preparar el proyecto

```bash
git clone https://github.com/rosellomateo/citypass-plus-analytics-frontend.git
cd citypass-plus-analytics-frontend
npm ci
cp .env.example .env.local
```

Iniciar el servidor con recarga automática:

```bash
npm run dev
```

Vite publica por defecto en <http://localhost:5173>.

## Scripts disponibles

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor local con hot reload. |
| `npm run build` | Validación TypeScript y build optimizado en `dist/`. |
| `npm run preview` | Sirve localmente el contenido de `dist/`. |
| `npm run lint` | Análisis estático con Oxlint. |
| `npm run test` | Suite de Vitest una vez. |
| `npm run test:watch` | Vitest en modo interactivo. |
| `npm run test:coverage` | Suite con reporte de cobertura. |

## Agregar o modificar un dominio

La integración mantiene separada la interfaz de la fuente de datos:

1. declarar el contrato remoto en `src/api/types.ts`;
2. registrar la ruta en `src/api/analyticsApi.ts`;
3. adaptar la respuesta en `src/dataSources/apiAnalyticsDataSource.ts`;
4. seleccionar mock o API en `src/dataSources/analyticsDataSource.ts`;
5. consumir esa función desde el hook del dominio;
6. conservar los cálculos y componentes existentes siempre que el contrato lo permita;
7. agregar pruebas para cliente, selector, adaptador y estados visuales.

No llamar a `fetch` directamente desde las páginas. Tampoco cambiar rutas o
campos del backend desde este repositorio.

## Probar estados visuales

Cualquier tablero puede forzar un estado mediante query string:

```text
http://localhost:5173/analytics/claims?uiState=loading
http://localhost:5173/analytics/claims?uiState=error
http://localhost:5173/analytics/claims?uiState=empty
```

## Flujo de ramas

Crear la funcionalidad desde `develop` actualizado:

```bash
git switch develop
git pull origin develop
git switch -c feature/nombre-de-la-tarea
git push -u origin feature/nombre-de-la-tarea
```

Los pull requests de funcionalidad se abren contra `develop`. Ejecutar lint,
pruebas y build antes de solicitar revisión.
