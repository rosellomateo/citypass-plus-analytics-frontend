// src/components/charts/BarChart.tsx
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { CHART_COLORS, CHART_AXIS, CHART_GRID, CHART_TOOLTIP_STYLE, CHART_LEGEND_STYLE } from './chartTheme';

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: { key: string; label?: string; color?: string }[];
  height?: number;
  unit?: string;
  showLegend?: boolean;
  horizontal?: boolean;
  colorField?: string; // campo del dato que contiene el color
}

export function BarChart({
  data,
  xKey,
  bars,
  height = 280,
  unit,
  showLegend = false,
  horizontal = false,
  colorField,
}: BarChartProps) {
  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 8 }}>
          <CartesianGrid {...CHART_GRID} horizontal={false} />
          <XAxis type="number" {...CHART_AXIS} tickFormatter={unit ? (v) => `${v}${unit}` : undefined} />
          <YAxis type="category" dataKey={xKey} {...CHART_AXIS} width={100} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [unit ? `${v}${unit}` : v]} />
          {bars.map((bar, i) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.label ?? bar.key}
              fill={bar.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
            >
              {colorField &&
                data.map((entry, j) => (
                  <Cell key={j} fill={(entry[colorField] as string) ?? CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
            </Bar>
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
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
        {bars.map((bar, i) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.label ?? bar.key}
            fill={bar.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          >
            {colorField &&
              data.map((entry, j) => (
                <Cell key={j} fill={(entry[colorField] as string) ?? CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
          </Bar>
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
