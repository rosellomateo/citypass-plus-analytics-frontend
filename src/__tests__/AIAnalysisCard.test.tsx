import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AIAnalysisCard } from '../components/common/AIAnalysisCard/AIAnalysisCard';
import type { AIAnalysisReport } from '../types';

const report: AIAnalysisReport = {
  caso_de_uso: 'movilidad',
  ultima_semana: '2026-W38',
  analisis: [
    {
      semana: '2026-W38',
      resumen: {
        parrafo_ejecutivo: 'La movilidad mantuvo una demanda estable.',
        puntos_destacados: ['Aumentaron los viajes semanales.'],
        recomendaciones: ['Reforzar las estaciones con mayor demanda.'],
        riesgos: ['Posibles demoras en hora pico.'],
      },
      metadata: {
        filas_enviadas: 42,
        version_esquema: '1.0',
        llm: { deployment: 'analysis-model' },
      },
    },
  ],
};

describe('AIAnalysisCard', () => {
  it('renders the report summary and details', () => {
    render(<AIAnalysisCard report={report} />);

    expect(screen.getByText(/Reporte de IA/)).toHaveTextContent('MOVILIDAD');
    expect(screen.getByText('La movilidad mantuvo una demanda estable.')).toBeInTheDocument();
    expect(screen.getByText('Aumentaron los viajes semanales.')).toBeInTheDocument();
    expect(screen.getByText('Reforzar las estaciones con mayor demanda.')).toBeInTheDocument();
    expect(screen.getByText('Posibles demoras en hora pico.')).toBeInTheDocument();
    expect(screen.getByText('Filas procesadas: 42')).toBeInTheDocument();
  });

  it('renders the analysis identified by ultima_semana instead of the first item', () => {
    const multiWeekReport: AIAnalysisReport = {
      ...report,
      ultima_semana: '2026-W40',
      analisis: [
        {
          semana: '2026-W38',
          resumen: { parrafo_ejecutivo: 'Análisis antiguo que no debe mostrarse.' },
        },
        {
          semana: '2026-W40',
          resumen: { parrafo_ejecutivo: 'Análisis de la semana más reciente.' },
        },
      ],
    };

    render(<AIAnalysisCard report={multiWeekReport} />);

    expect(screen.getByText('Análisis de la semana más reciente.')).toBeInTheDocument();
    expect(screen.queryByText('Análisis antiguo que no debe mostrarse.')).not.toBeInTheDocument();
    expect(screen.getByText('2026-W40')).toBeInTheDocument();
  });

  it('collapses and expands the detailed analysis', async () => {
    const user = userEvent.setup();
    render(<AIAnalysisCard report={report} />);

    await user.click(screen.getByRole('button', { name: /Ocultar detalles/i }));
    expect(screen.queryByText('Aumentaron los viajes semanales.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ver análisis completo/i }));
    expect(screen.getByText('Aumentaron los viajes semanales.')).toBeInTheDocument();
  });

  it('does not render an empty report', () => {
    const { container } = render(<AIAnalysisCard report={{ analisis: [] }} />);

    expect(container).toBeEmptyDOMElement();
  });
});
