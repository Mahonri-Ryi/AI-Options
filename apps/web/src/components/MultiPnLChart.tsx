import type { PnLPoint } from '@ai-options/core';
import './MultiPnLChart.css';

interface CurveSeries {
  label: string;
  data: PnLPoint[];
  color?: string;
}

interface MultiPnLChartProps {
  series: CurveSeries[];
  currentPrice?: number;
}

const COLORS = ['#55cfff', '#a78bfa', '#f59e0b', '#22c55e'];

export function MultiPnLChart({ series, currentPrice }: MultiPnLChartProps) {
  const validSeries = series.filter((s) => s.data.length >= 2);
  if (validSeries.length === 0) return null;

  const width = 480;
  const height = 240;
  const padding = { top: 16, right: 12, bottom: 40, left: 52 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allPrices = validSeries.flatMap((s) => s.data.map((d) => d.stockPrice));
  const allPnls = validSeries.flatMap((s) => s.data.map((d) => d.pnl));
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const minPnl = Math.min(...allPnls, 0);
  const maxPnl = Math.max(...allPnls, 0);
  const pnlRange = maxPnl - minPnl || 1;
  const priceRange = maxPrice - minPrice || 1;

  const x = (price: number) => padding.left + ((price - minPrice) / priceRange) * chartW;
  const y = (pnl: number) => padding.top + chartH - ((pnl - minPnl) / pnlRange) * chartH;
  const zeroY = y(0);
  const currentX = currentPrice !== undefined ? x(currentPrice) : null;

  return (
    <div className="multi-pnl-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="pnl-svg">
        <line
          x1={padding.left}
          y1={zeroY}
          x2={width - padding.right}
          y2={zeroY}
          className="zero-line"
        />

        {currentX !== null ? (
          <line
            x1={currentX}
            y1={padding.top}
            x2={currentX}
            y2={height - padding.bottom}
            className="price-line"
          />
        ) : null}

        {validSeries.map((s, idx) => {
          const color = s.color ?? COLORS[idx % COLORS.length];
          const path = s.data
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.stockPrice)} ${y(p.pnl)}`)
            .join(' ');
          return (
            <path key={s.label} d={path} className="pnl-line-multi" stroke={color} fill="none" />
          );
        })}

        <text x={padding.left} y={height - 8} className="axis-label">
          ${minPrice.toFixed(0)}
        </text>
        <text x={width - padding.right - 28} y={height - 8} className="axis-label">
          ${maxPrice.toFixed(0)}
        </text>
      </svg>

      <div className="multi-pnl-legend">
        {validSeries.map((s, idx) => (
          <span key={s.label} className="legend-item">
            <span
              className="legend-swatch"
              style={{ background: s.color ?? COLORS[idx % COLORS.length] }}
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
