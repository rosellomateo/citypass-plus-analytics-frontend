# Despliegue y CI/CD

## Flujos de GitHub Actions

| Archivo | Disparador | Resultado |
| --- | --- | --- |
| `.github/workflows/ci.yml` | Push o pull request a `develop` y `main` | Lint, pruebas con cobertura, build y validación de la imagen Docker. |
| `.github/workflows/develop_citypass-frontend-test.yml` | Push a `develop` o ejecución manual | Construye el frontend en modo API, publica la imagen en GHCR y la despliega en el Web App de test. |
| `.github/workflows/cd.yml` | Tag `v*.*.*` | Publica una imagen versionada en GitHub Container Registry. |
| `.github/workflows/deploy-frontend-storage.yml` | Tag `frontend-test-v*` | Compila `dist/` y lo sube al sitio estático de Azure Storage. |
| `.github/workflows/deploy-production.yml` | Push a `main` o ejecución manual | Valida, construye la imagen en modo API, la publica en GHCR y la despliega en el Web App productivo. |

La imagen de test se publica como:

```text
ghcr.io/rosellomateo/citypass-plus-analytics-frontend:<commit-sha>
```

El despliegue de test usa el Web App `citypass-frontend-test`, dentro del resource
group `rg-citypass-frontend`. La imagen se compila con el backend de test como
`VITE_API_BASE_URL`. El flujo anterior de Azure Storage por tag se conserva,
pero no interviene en este despliegue.

Las variables opcionales `TEST_BACKEND_PUBLIC_URL` y
`TEST_FRONTEND_PUBLIC_URL` permiten reemplazar los dominios de test desde
GitHub sin editar el workflow. Mientras no se definan, se utilizan los dominios
actuales de Azure Web Apps.

## Entorno de test en Azure Web App

Crear estos secretos en el repositorio de GitHub:

| Secreto | Uso |
| --- | --- |
| `GHCR_PULL_TOKEN` | PAT de GitHub con `read:packages`, usado por Azure para descargar la imagen privada. |
| `AZURE_CLIENT_ID` | Client ID de la identidad usada por GitHub Actions. |
| `AZURE_TENANT_ID` | Tenant de Microsoft Entra. |
| `AZURE_SUBSCRIPTION_ID` | Suscripción donde existe el Web App. |

La identidad necesita `Website Contributor` sobre el Web App y una credencial
federada para:

```text
repo:rosellomateo/citypass-plus-analytics-frontend:ref:refs/heads/develop
```

El frontend sirve Nginx en el puerto `80`, por lo que App Service no necesita
un puerto alternativo. El pipeline valida tanto `/health` como `/`.

## Entorno de producción

Crear en GitHub un environment llamado `production` con estos valores:

| Tipo | Nombre | Uso |
| --- | --- | --- |
| Variable | `AZURE_WEBAPP_NAME` | Nombre del Web App productivo del frontend. |
| Variable | `AZURE_RESOURCE_GROUP` | Resource group que contiene el Web App productivo. |
| Variable | `VITE_API_BASE_URL` | URL HTTPS pública del backend productivo. |
| Variable | `FRONTEND_PUBLIC_URL` | URL HTTPS pública del frontend productivo. |
| Secreto | `GHCR_PULL_TOKEN` | PAT con `read:packages`, usado por Azure para descargar la imagen privada. |
| Secreto | `AZURE_CLIENT_ID` | Client ID de la identidad usada por GitHub Actions. |
| Secreto | `AZURE_TENANT_ID` | Tenant de Microsoft Entra. |
| Secreto | `AZURE_SUBSCRIPTION_ID` | Suscripción donde existe el Web App. |

El workflow comprueba que todos estén definidos antes del build y el despliegue.
Opcionalmente se pueden exigir revisores para aprobar cada despliegue mediante
las reglas de protección del environment.

## Requisito: inyectar la configuración durante el build

El frontend es estático. `VITE_DATA_SOURCE` y `VITE_API_BASE_URL` deben existir
en el paso que ejecuta el build; definirlas después en el servidor no modifica
los archivos generados.

`VITE_API_BASE_URL` puede guardarse como una variable de GitHub del entorno, no
como secreto, porque su valor queda público en el navegador.

Para una imagen Docker, los valores deben enviarse como build args:

```yaml
build-args: |
  VITE_DATA_SOURCE=api
  VITE_API_BASE_URL=${{ vars.VITE_API_BASE_URL }}
```

## Estado actual de los workflows

El workflow productivo de `main` ya inyecta `VITE_DATA_SOURCE=api` y
`VITE_API_BASE_URL` durante el build. Los workflows anteriores conservan estas
condiciones:

- el workflow de Azure Storage ejecuta `npm run build` sin variables `VITE_*`;
  si no se las inyecta, la aplicación desplegada no tendrá una fuente válida;
- el workflow de GHCR no envía build args y el Dockerfile usa por defecto
  `VITE_DATA_SOURCE=api` con `VITE_API_BASE_URL=http://localhost:8000`.

Estas limitaciones afectan al despliegue de test por tag y a las imágenes de
GHCR, no al nuevo despliegue productivo desde `main`.

## Preparar Azure Web App productivo

Crear un Web App Linux de tipo Container y mantener deshabilitado el soporte de
sidecar. Puede usarse Nginx Quickstart como imagen inicial; el workflow la
reemplaza por la imagen publicada en GHCR.

La identidad de GitHub Actions necesita `Website Contributor` sobre el Web App
y una credencial federada que coincida con el environment `production`. El
frontend sirve Nginx por el puerto `80` y expone `/health`.

Agregar la URL pública exacta del frontend a `CORS_ALLOWED_ORIGINS` del backend
productivo antes de desplegar la interfaz.

## Orden recomendado de despliegue

1. Desplegar el backend.
2. Verificar `https://<backend>/health` y un endpoint `/analytics/*`.
3. Configurar en el backend el origen público del frontend mediante CORS.
4. Configurar `VITE_API_BASE_URL` con la URL pública verificada del backend.
5. Integrar la rama aprobada en `main`; el workflow productivo se ejecuta automáticamente.
6. Esperar que el workflow finalice correctamente.
7. Recorrer los cinco tableros y revisar Network y Console en el navegador.

El workflow antiguo de Azure Storage puede ejecutarse únicamente mediante sus
tags históricos y no participa en producción. Ejemplo:

```bash
git tag frontend-test-v1.0.0
git push origin frontend-test-v1.0.0
```

Ejemplo para publicar la imagen:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Producción no requiere crear un tag. También se puede volver a ejecutar
manualmente desde Actions sobre el commit actual de `main`.

## Lista de verificación

- [ ] CI finaliza correctamente en el commit que se va a etiquetar.
- [ ] La URL del backend usa HTTPS y responde desde Internet.
- [ ] El build usa `VITE_DATA_SOURCE=api`.
- [ ] El build recibe la URL pública correcta en `VITE_API_BASE_URL`.
- [ ] CORS del backend contiene el origen exacto del frontend.
- [ ] El Web App obtiene la imagen privada desde GHCR.
- [ ] `/health` del frontend responde `200`.
- [ ] Ninguna variable `VITE_*` contiene secretos.
- [ ] Los tableros muestran datos reales y no mocks.
- [ ] Se reconoce que login y tokens todavía no están implementados.

## Rollback

Para volver atrás, desplegar una etiqueta de imagen estable anterior. Si un PAT
de GHCR fue expuesto, revocarlo o rotarlo inmediatamente.
