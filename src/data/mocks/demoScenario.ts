import { useSyncExternalStore } from 'react';

let scenario: number | null = null;
const listeners = new Set<() => void>();

export function selectDemoScenario(next: number | null) {
  scenario = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDemoScenario() {
  return useSyncExternalStore(subscribe, () => scenario, () => null);
}
