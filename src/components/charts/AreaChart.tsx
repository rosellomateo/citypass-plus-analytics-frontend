// src/components/charts/AreaChart.tsx
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS, CHART_AXIS, CHART_GRID, CHART_TOOLTIP_STYLE, CHART_LEGEND_STYLE } from './chartTheme';

interface AreaChartProps {
  data: any[];
  xKey: string;
  areas: { key: string; label?: string; color?: string }[];
  height?: number;
  unit?: string;
  showLegend?: boolean;
  stacked?: boolean;
}

export function AreaChart({
  data,
  xKey,
  areas,
  height = 280,
  unit,
  showLegend = false,
  stacked = false,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
        <defs>
          {areas.map((area, i) => {
            const color = area.color ?? CHART_COLORS[i % CHART_COLORS.length];
            return (
              <linearGradient key={area.key} id={`grad-${area.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid {...CHART_GRID} vertical={false} />
        <XAxis dataKey={xKey} {...CHART_AXIS} />
        <YAxis {...CHART_AXIS} tickFormatter={unit ? (v) => `${v}${unit}` : undefined} />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={(value: any, name: any) => [
            unit ? `${value}${unit}` : value,
            name,
          ]}
        />
        {showLegend && <Legend wrapperStyle={CHART_LEGEND_STYLE} />}
        {areas.map((area, i) => {
          const color = area.color ?? CHART_COLORS[i % CHART_COLORS.length];
          return (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              name={area.label ?? area.key}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${area.key})`}
              stackId={stacked ? 'stack' : undefined}
              dot={false}
              activeDot={{ r: 4 }}
            />
          );
        })}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
