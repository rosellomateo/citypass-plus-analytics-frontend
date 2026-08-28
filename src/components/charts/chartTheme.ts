// src/components/charts/chartTheme.ts
// Configuración visual compartida para todos los wrappers de Recharts

export const CHART_COLORS = [
  '#2563A6', // cityBlue — movilidad
  '#4F8A72', // cityGreen — residuos
  '#D99838', // cityOrange — reclamos
  '#C83E4D', // cityRed — emergencias
  '#8FB8D8', // azul secundario — cultura
  '#1A4A7A', // azul oscuro — seguridad
  '#142430', // sidebar — eda
];

export const CHART_FONT_FAMILY = "'Inter', sans-serif";
export const CHART_FONT_SIZE = 12;
export const CHART_FONT_COLOR = '#6B7480';

export const CHART_GRID = {
  stroke: '#E8EBF0',
  strokeDasharray: '3 3',
};

export const CHART_AXIS = {
  tick: { fill: '#9BA3AE', fontSize: CHART_FONT_SIZE, fontFamily: CHART_FONT_FAMILY },
  axisLine: { stroke: '#E8EBF0' },
  tickLine: false as const,
};

export const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E8EBF0',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: '12px',
  fontFamily: CHART_FONT_FAMILY,
  color: '#1A2332',
  padding: '8px 12px',
};

export const CHART_LEGEND_STYLE: React.CSSProperties = {
  fontSize: '12px',
  fontFamily: CHART_FONT_FAMILY,
  color: '#6B7480',
};

// Altura por defecto de los gráficos
export const CHART_HEIGHT = {
  sm: 200,
  md: 280,
  lg: 320,
};

// Importar React para el tipo de CSSProperties
import type React from 'react';
