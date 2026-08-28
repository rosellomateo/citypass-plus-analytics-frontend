// src/components/charts/LineChart.tsx
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS, CHART_AXIS, CHART_GRID, CHART_TOOLTIP_STYLE, CHART_LEGEND_STYLE } from './chartTheme';

interface LineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  lines: { key: string; label?: string; color?: string }[];
  height?: number;
  unit?: string;
  showLegend?: boolean;
}

export function LineChart({ data, xKey, lines, height = 280, unit, showLegend = true }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid {...CHART_GRID} vertical={false} />
        <XAxis dataKey={xKey} {...CHART_AXIS} />
        <YAxis {...CHART_AXIS} tickFormatter={unit ? (v) => `${v}${unit}` : undefined} />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={(value: number, name: string) => [
            unit ? `${value}${unit}` : value,
            name,
          ]}
        />
        {showLegend && <Legend wrapperStyle={CHART_LEGEND_STYLE} />}
        {lines.map((line, i) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.label ?? line.key}
            stroke={line.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
