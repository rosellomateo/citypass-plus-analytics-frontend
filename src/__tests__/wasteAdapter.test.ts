// src/__tests__/wasteAdapter.test.ts
import { describe, it, expect } from 'vitest';
import { adaptWasteInput } from '../adapters/wasteAdapter';
import type { WasteInputJson } from '../types';

describe('Waste Adapter (wasteAdapter.ts)', () => {
  it('handles empty or malformed JSON input gracefully', () => {
    // @ts-expect-error testing invalid input
    expect(adaptWasteInput(null)).toEqual([]);
    // @ts-expect-error testing invalid input
    expect(adaptWasteInput({})).toEqual([]);
  });

  it('normalizes raw JSON fields and correctly classifies container statuses', () => {
    const rawInput: WasteInputJson = {
      generatedAt: '2026-09-02T12:00:00Z',
      records: [
        {
          containerId: 'C-01',
          zone: 'Centro',
          wasteType: 'Orgánico',
          currentFillPct: 30,
        },
        {
          containerId: 'C-02',
          zone: 'Palermo',
          wasteType: 'Reciclable',
          currentFillPct: 65,
        },
        {
          containerId: 'C-03',
          zone: 'Belgrano',
          wasteType: 'Peligroso',
          currentFillPct: 85,
        },
        {
          containerId: 'C-04',
          zone: 'Caballito',
          wasteType: 'Voluminoso',
          currentFillPct: 95,
          isOverflowing: true,
        },
      ],
    };

    const adapted = adaptWasteInput(rawInput);

    expect(adapted).toHaveLength(4);

    // C-01: NORMAL (<50%)
    expect(adapted[0].status).toBe('NORMAL');
    expect(adapted[0].fillLevelPct).toBe(30);

    // C-02: MEDIO (50%-80%)
    expect(adapted[1].status).toBe('MEDIO');
    expect(adapted[1].fillLevelPct).toBe(65);

    // C-03: CRÍTICO (>80%)
    expect(adapted[2].status).toBe('CRÍTICO');
    expect(adapted[2].fillLevelPct).toBe(85);

    // C-04: DESBORDADO (isOverflowing: true)
    expect(adapted[3].status).toBe('DESBORDADO');
    expect(adapted[3].isOverflowing).toBe(true);
  });
});
