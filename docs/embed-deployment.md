# Empaquetado y publicación embed

`npm run build:embed` produce únicamente `dist-embed/embed.html`: JavaScript,
estilos e iconos incluidos en un archivo. No requiere login dentro del iframe
ni consulta APIs, fuentes o archivos externos. La web normal conserva su login
y sus consultas de datos.

La plantilla contiene una vez cada marcador:

- `__CITYPASS_MODULO__` en `html[data-modulo]`.
- `__CITYPASS_DATOS__` en `script#citypass-datos[type="application/json"]`.

El backend reemplaza ambos marcadores después de autorizar el request. Los datos
son el mismo objeto `{datos, informe}` que devuelve su endpoint de analítica.
Se soportan `reclamos`, `emergencias`, `movilidad`, `espacios`, `residuos` e
`identidad`. Identidad reutiliza el Tablero de Login Federado y admite
`informe: null`, como su servicio del backend; los eventos se muestran aunque
todavía no exista el informe de IA. En modo embed no se consulta `/analytics/identidad`.
Los indicadores adicionales de parte 2 no se solicitan desde el iframe porque
el contrato actual del backend no los incluye en ese objeto. No se inventan
valores para esos indicadores.

## Validación

```bash
npm ci
npm run test:coverage
npm run build:embed
node scripts/package-embed.mjs
npx playwright install --with-deps chromium
npm run test:embed
```

El script de empaquetado valida el HTML, el límite de 5 MiB y los marcadores;
después genera `manifest.json` y `SHA256SUMS`. Las pruebas de navegador verifican
los seis tableros con datos inyectados (Identidad con y sin informe), el CSP del backend y un iframe
`sandbox="allow-scripts"` sin `allow-same-origin`, bloqueando cualquier petición
de red adicional. El HTML compilado y los metadatos no se guardan en Git.

El CI valida este paquete en cada PR y push a `develop` o `main`; ya no se omite
por una variable de activación.

## Publicación en Azure Blob

1. Integrar el código validado en `main`.
2. Configurar la variable de repositorio `EMBED_BUILD_ENABLED=true`.
3. Ejecutar **Publish embedded frontend to Blob** desde `main`, o publicar un tag
   `embed-v*` sobre la versión deseada.

El environment `embed` mantiene las variables `AZURE_STORAGE_ACCOUNT=citypassstorage`
y `AZURE_STORAGE_CONTAINER=plantillas` y los secretos OIDC de Azure. La identidad
de GitHub necesita Storage Blob Data Contributor sobre el contenedor privado.

El workflow construye y prueba una sola vez; publica el mismo artefacto en:

```text
plantillas/releases/<SHA completo del frontend>/embed.html
plantillas/releases/<SHA completo del frontend>/manifest.json
plantillas/releases/<SHA completo del frontend>/SHA256SUMS
```

Verifica los tres archivos descargándolos nuevamente. `SHA256SUMS` se publica al
final para marcar una versión completa. No sobrescribe versiones diferentes.

## Activar la versión en el backend

Desplegar primero el backend compatible con el manifiesto de seis módulos.
El backend anterior solo acepta cinco y rechaza una release con Identidad.
El backend actualizado puede seguir utilizando la release anterior para los otros
cinco módulos; Identidad devuelve 503 hasta configurar una release que la incluya.

Una vez que **publish** termina correctamente, configurar en la Web App del backend:

```dotenv
EMBED_RELEASE_SHA=<SHA completo que informa el workflow publicado>
```

Usar los 40 caracteres del commit del frontend que se publicó, no el commit del
backend ni el checksum del archivo. Guardar la configuración reinicia la app y
vacía su caché de plantilla. El backend necesita su Managed Identity con Storage
Blob Data Reader sobre `plantillas`, además de `EMBED_STORAGE_ACCOUNT_URL` y
`EMBED_STORAGE_CONTAINER`. Un request autenticado a `/embed/{modulo}` devuelve
el HTML con datos; sin JWT debe seguir devolviendo 401.
