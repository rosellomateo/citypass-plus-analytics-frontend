export const EMBED_MODULES = ['reclamos', 'emergencias', 'movilidad', 'espacios', 'residuos', 'identidad'] as const;
export type EmbedModule = typeof EMBED_MODULES[number];

export function getEmbeddedModule(): EmbedModule | undefined {
  const value = document.documentElement.dataset.modulo;
  return EMBED_MODULES.find((module) => module === value);
}
