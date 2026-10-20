# Registro de integración JWT — Analítica Urbana

## Flujo que usa el frontend

1. Login autentica a la persona y entrega `access_token` y `refresh_token`.
2. El frontend acepta ese par solamente desde `VITE_AUTH_LOGIN_ORIGIN` y lo deja
   en memoria de la pestaña. No va a URL, logs ni almacenamiento del navegador.
3. Para consultar analítica, envía `Authorization: Bearer <access_token>`.
4. Si la API responde `401`, llama `POST {VITE_IDP_BASE_URL}/auth/refresh` con el
   refresh token. Reemplaza los dos tokens por la respuesta y reintenta una vez.
5. Si refresh falla, elimina ambos tokens y Login debe iniciar una sesión nueva.

El refresh token no se manda a los endpoints `/analytics/**`. El access token no
se reenvía a otros sistemas ni al bus de eventos.

## Pantallas que el frontend habilita

| Grupo exacto | Pantallas |
| --- | --- |
| `seguridad-urbana` | Emergencias |
| `cultura` | Cultura y eventos |
| `movilidad-urbana` | Movilidad |
| `reclamos` | Reclamos |
| `residuos` | Residuos |
| `analitica-urbana` | Inicio y todos los dashboards |

Una sesión válida sin alguno de estos grupos muestra “Sin accesos asignados”.
Los grupos ajenos o desconocidos no otorgan permisos. Esta regla también debe
existir en Backend: ocultar una ruta en el navegador no protege un endpoint.

## Lo que Backend debe validar en cada request

- Firma RS256 usando el JWKS del IdP con caché; nunca `decode()` como validación.
- `iss` exacto: `https://idp.citypass.local`.
- Audience propia dentro de `aud`, que siempre es una lista.
- `token_use: human`, `ver: 1` y `exp` obligatorio y vigente.
- Tipos de `sub` y `groups`; `sub` es el ID estable que se guarda y audita.
- Autorización por la misma tabla de grupos. Sin token o token inválido: `401`;
  token válido sin permiso: `403`.

El token humano dura 15 minutos. Si se deshabilita una persona, puede conservar
acceso hasta ese vencimiento; su próximo refresh falla, según el contrato.
