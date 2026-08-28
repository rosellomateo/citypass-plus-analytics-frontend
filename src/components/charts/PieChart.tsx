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

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius="75%"
          dataKey="value"
          paddingAngle={2}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, i) => (
            <Cell
              key={entry.name}
              fill={entry.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={(value: number, name: string) => [
            unit ? `${value.toLocaleString()}${unit}` : value.toLocaleString(),
            name,
          ]}
        />
        {showLegend && <Legend wrapperStyle={CHART_LEGEND_STYLE} />}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
