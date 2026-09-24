# Pruebas y controles de calidad

## Controles locales

```bash
npm run lint
npm run test:coverage
npm run build
```

El build ejecuta primero TypeScript y luego Vite. Los tres comandos deben
completar correctamente antes de abrir un pull request.

## Suite de pruebas

Las pruebas se ejecutan con Vitest, jsdom y Testing Library.

| Archivo | Alcance principal |
| --- | --- |
| `apiClient.test.ts` | URL base, solicitud GET y errores HTTP. |
| `dataSource.test.ts` | Validación del selector `api` o `mock`. |
| `services.test.ts` | Cálculos y agregaciones de los dominios. |
| `wasteAdapter.test.ts` | Adaptación del contrato real de residuos. |
| `wasteService.test.ts` | Métricas del modo mock de residuos. |
| `MetricCard.test.tsx` | Representación del componente de métrica. |
| `AIAnalysisCard.test.tsx` | Representación del análisis de IA. |

Ejecutar una vez:

```bash
npm run test
```

Mantener Vitest activo durante el desarrollo:

```bash
npm run test:watch
```

Generar cobertura:

```bash
npm run test:coverage
```

El reporte se crea en `coverage/`. El pipeline lo publica como artefacto durante
siete días.

## Prueba integrada con la API

La suite automatizada no reemplaza una verificación completa con datos Gold.
Para esa prueba:

1. iniciar el backend con credenciales válidas;
2. configurar el frontend en modo `api`;
3. comprobar `/health` y un endpoint con curl;
4. recorrer los cinco tableros;
5. revisar que no existan errores HTTP ni CORS en Network y Console;
6. comparar al menos un total visible con la respuesta de la API.

La guía completa está en [integración con el backend](backend-integration.md).
