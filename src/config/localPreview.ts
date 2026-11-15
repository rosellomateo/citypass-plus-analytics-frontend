export function isLocalPreview(): boolean {
  return import.meta.env.DEV && (import.meta.env.MODE === 'mock' || import.meta.env.MODE === 'presentation');
}
