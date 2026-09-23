// src/components/charts/PieChart.tsx
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS, CHART_TOOLTIP_STYLE, CHART_LEGEND_STYLE } from './chartTheme';

interface PieChartProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  showLegend?: boolean;
  donut?: boolean;
  unit?: string;
}

export function PieChart({ data, height = 280, showLegend = true, donut = true, unit }: PieChartProps) {
  const innerRadius = donut ? '55%' : 0;
  // Ocultar elementos con valor 0 para no saturar leyenda o gráfico
  const visibleData = data.filter((d) => d.value > 0);

  if (visibleData.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6B7280',
          fontSize: '14px',
          fontWeight: 500,
          textAlign: 'center',
          padding: '16px',
        }}
      >
        No se tienen datos suficientes como para formar el gráfico.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={visibleData}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius="75%"
          dataKey="value"
          paddingAngle={2}
          label={({ name, percent }) => ((percent ?? 0) >= 0.10 ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : '')}
          labelLine={false}
        >
          {visibleData.map((entry, i) => (
            <Cell
              key={entry.name}
              fill={entry.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={(value: any, name: any) => [
            unit ? `${value?.toLocaleString() ?? value}${unit}` : value?.toLocaleString() ?? value,
            name,
          ]}
        />
        {showLegend && <Legend wrapperStyle={CHART_LEGEND_STYLE} />}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
