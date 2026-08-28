// src/utils/delay.ts
// Latencia mock determinística — reemplazar por 0 en tests

export const MOCK_DELAY = 500; // ms

export function delay(ms: number = MOCK_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
