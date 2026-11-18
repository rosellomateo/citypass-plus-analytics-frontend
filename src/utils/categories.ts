/** Display normalization only; the received records remain unchanged. */
export function activityCategory(value: string | null): string {
  const text = (value ?? '').trim().replace(/\s+/g, ' ').replace(/MÃºsica/gi, 'Música');
  const key = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const labels: Record<string, string> = {
    CULTURAL: 'Cultura', CULTURA: 'Cultura', DEPORTIVO: 'Deportivo',
    RECREATIVO: 'Recreativo', MUSICA: 'Música', 'M�SICA': 'Música',
    'MÃºSICA': 'Música', TECNOLOGIA: 'Tecnología', 'TECNOLOG�A': 'Tecnología',
    ARTE: 'Arte', LITERATURA: 'Literatura', TALLERES: 'Talleres',
  };
  return labels[key] ?? (text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : 'Sin categoría');
}

export function emergencyPriority(value: string | null): string {
  const key = (value ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  return key === 'MEDIO' ? 'MEDIA' : key || 'SIN PRIORIDAD';
}

export function emergencyCause(value?: string | null): string {
  const key = value?.trim().toUpperCase();
  const labels: Record<string, string> = {
    EVENTO_CLIMATICO: 'Clima', RECLAMO: 'Reclamos', EVENTO_PUBLICO: 'Evento público',
    MOVILIDAD_BICICLETA: 'Viajes en bicicleta', INCIDENTE_VIAL: 'Incidente vial',
    ACCIDENTE_VIAL: 'Accidente vial', RESERVA: 'Reserva de espacio público',
  };
  return key ? labels[key] ?? key.replaceAll('_', ' ').toLowerCase() : 'Sin causa informada';
}
