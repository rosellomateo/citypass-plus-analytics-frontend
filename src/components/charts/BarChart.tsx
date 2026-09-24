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

interface BarConfig {
  key: string;
  label?: string;
  color?: string;
  stackId?: string;
}

interface BarChartProps {
  data: any[];
  xKey: string;
  bars: BarConfig[];
  height?: number;
  unit?: string;
  showLegend?: boolean;
  horizontal?: boolean;
  colorField?: string; // campo del dato que contiene el color
  scrollable?: boolean;
  minWidth?: number;
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
  scrollable = false,
  minWidth,
}: BarChartProps) {
  const calculatedMinWidth = minWidth ?? (scrollable && data.length > 5 ? Math.max(600, data.length * 80) : undefined);

  const chartContent = (
    <ResponsiveContainer width="100%" height={height}>
      {horizontal ? (
        <RechartsBarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 8 }}>
          <CartesianGrid {...CHART_GRID} horizontal={false} />
          <XAxis type="number" {...CHART_AXIS} tickFormatter={unit ? (v) => `${v}${unit}` : undefined} />
          <YAxis type="category" dataKey={xKey} {...CHART_AXIS} width={145} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: any) => [unit ? `${v}${unit}` : v]} />
          {showLegend && <Legend wrapperStyle={CHART_LEGEND_STYLE} />}
          {bars.map((bar, i) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.label ?? bar.key}
              fill={bar.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              stackId={bar.stackId}
              radius={bar.stackId ? [0, 0, 0, 0] : [0, 4, 4, 0]}
              maxBarSize={24}
            >
              {colorField &&
                data.map((entry, j) => (
                  <Cell key={j} fill={(entry[colorField] as string) ?? CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
            </Bar>
          ))}
        </RechartsBarChart>
      ) : (
        <RechartsBarChart data={data} margin={{ top: 12, right: 16, bottom: 24, left: 0 }}>
          <CartesianGrid {...CHART_GRID} vertical={false} />
          <XAxis dataKey={xKey} {...CHART_AXIS} interval={0} tick={{ fontSize: 12 }} />
          <YAxis {...CHART_AXIS} tickFormatter={unit ? (v) => `${v}${unit}` : undefined} />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value: any, name: any) => [
              unit ? `${value}${unit}` : value,
              name,
            ]}
          />
          {showLegend && <Legend wrapperStyle={CHART_LEGEND_STYLE} verticalAlign="top" align="right" height={36} />}
          {bars.map((bar, i) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.label ?? bar.key}
              fill={bar.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              stackId={bar.stackId}
              radius={bar.stackId ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              maxBarSize={44}
            >
              {colorField &&
                data.map((entry, j) => (
                  <Cell key={j} fill={(entry[colorField] as string) ?? CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
            </Bar>
          ))}
        </RechartsBarChart>
      )}
    </ResponsiveContainer>
  );

  if (calculatedMinWidth) {
    return (
      <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '8px' }}>
        <div style={{ minWidth: `${calculatedMinWidth}px`, height: `${height}px` }}>
          {chartContent}
        </div>
      </div>
    );
  }

  return chartContent;
}

