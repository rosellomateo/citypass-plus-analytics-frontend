export function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!baseUrl) throw new Error('Falta configurar VITE_API_BASE_URL.');
  return baseUrl.replace(/\/$/, '');
}
