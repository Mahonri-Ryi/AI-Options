import type { PnLPoint } from '@ai-options/core';
import './PnLChart.css';

interface PnLChartProps {
  data: PnLPoint[];
  currentPrice?: number;
}

export function PnLChart({ data, currentPrice }: PnLChartProps) {
  if (data.length < 2) return null;

  const width = 480;
  const height = 220;
  const padding = { top: 16, right: 12, bottom: 32, left: 52 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const prices = data.map((d) => d.stockPrice);
  const pnls = data.map((d) => d.pnl);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minPnl = Math.min(...pnls, 0);
  const maxPnl = Math.max(...pnls, 0);
  const pnlRange = maxPnl - minPnl || 1;
  const priceRange = maxPrice - minPrice || 1;

  const x = (price: number) => padding.left + ((price - minPrice) / priceRange) * chartW;
  const y = (pnl: number) => padding.top + chartH - ((pnl - minPnl) / pnlRange) * chartH;

  const linePath = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.stockPrice)} ${y(p.pnl)}`)
    .join(' ');

  const areaPath = `${linePath} L ${x(data[data.length - 1].stockPrice)} ${y(0)} L ${x(data[0].stockPrice)} ${y(0)} Z`;
  const zeroY = y(0);
  const currentX = currentPrice !== undefined ? x(currentPrice) : null;

  return (
    <div className="pnl-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="pnl-svg">
        <defs>
          <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#55cfff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#55cfff" stopOpacity="0" />
          </linearGradient>
        </defs>

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

        <path d={areaPath} fill="url(#pnlGradient)" />
        <path d={linePath} className="pnl-line" fill="none" />

        {currentX !== null ? <circle cx={currentX} cy={zeroY} r={4} className="price-dot" /> : null}

        <text x={padding.left} y={height - 8} className="axis-label">
          ${minPrice.toFixed(0)}
        </text>
        <text x={width - padding.right - 28} y={height - 8} className="axis-label">
          ${maxPrice.toFixed(0)}
        </text>
        <text x={8} y={padding.top + 4} className="axis-label">
          ${maxPnl.toFixed(0)}
        </text>
        <text x={8} y={height - padding.bottom} className="axis-label">
          ${minPnl.toFixed(0)}
        </text>
      </svg>
    </div>
  );
}
