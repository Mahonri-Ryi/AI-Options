import type { ChartAxes, PnLPoint } from '@ai-options/core';
import './PnLChart.css';

interface PnLChartProps {
  data: PnLPoint[];
  theoreticalData?: PnLPoint[];
  currentPrice?: number;
  chartAxes?: ChartAxes;
  expirationLabel?: string;
  theoreticalLabel?: string;
}

export function PnLChart({
  data,
  theoreticalData,
  currentPrice,
  chartAxes,
  expirationLabel = 'At Expiration',
  theoreticalLabel = 'Today (T+0)',
}: PnLChartProps) {
  if (data.length < 2) return null;

  const width = 480;
  const height = 240;
  const padding = { top: 16, right: 12, bottom: 40, left: 56 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allCurves = theoreticalData ? [data, theoreticalData] : [data];
  const prices = allCurves.flatMap((curve) => curve.map((d) => d.stockPrice));
  const pnls = allCurves.flatMap((curve) => curve.map((d) => d.pnl));

  const minPrice = chartAxes ? Math.min(...prices) : Math.min(...prices);
  const maxPrice = chartAxes ? Math.max(...prices) : Math.max(...prices);
  const [yMin, yMax] = chartAxes?.yDomain ?? [Math.min(...pnls, 0), Math.max(...pnls, 0)];
  const minPnl = yMin;
  const maxPnl = yMax;
  const pnlRange = maxPnl - minPnl || 1;
  const priceRange = maxPrice - minPrice || 1;

  const x = (price: number) => padding.left + ((price - minPrice) / priceRange) * chartW;
  const y = (pnl: number) => padding.top + chartH - ((pnl - minPnl) / pnlRange) * chartH;

  const buildPath = (curve: PnLPoint[]) =>
    curve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.stockPrice)} ${y(p.pnl)}`).join(' ');

  const linePath = buildPath(data);
  const theoreticalPath = theoreticalData ? buildPath(theoreticalData) : null;
  const areaPath = `${linePath} L ${x(data[data.length - 1].stockPrice)} ${y(0)} L ${x(data[0].stockPrice)} ${y(0)} Z`;
  const zeroY = y(0);
  const currentX = currentPrice !== undefined ? x(currentPrice) : null;

  const xTicks = chartAxes?.xTicks ?? [minPrice, maxPrice];
  const yTicks = chartAxes?.yTicks ?? [maxPnl, minPnl];

  return (
    <div className="pnl-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="pnl-svg">
        <defs>
          <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#55cfff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#55cfff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => (
          <line
            key={`y-grid-${tick}`}
            x1={padding.left}
            y1={y(tick)}
            x2={width - padding.right}
            y2={y(tick)}
            className="grid-line"
          />
        ))}

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
        {theoreticalPath ? (
          <path d={theoreticalPath} className="pnl-line theoretical-line" fill="none" />
        ) : null}
        <path d={linePath} className="pnl-line expiration-line" fill="none" />

        {currentX !== null ? <circle cx={currentX} cy={zeroY} r={4} className="price-dot" /> : null}

        {xTicks.map((tick, index) => (
          <text
            key={`x-${tick}-${index}`}
            x={x(tick)}
            y={height - 8}
            className="axis-label axis-label-center"
            textAnchor="middle"
          >
            ${tick.toFixed(0)}
          </text>
        ))}

        {yTicks.map((tick, index) => (
          <text key={`y-${tick}-${index}`} x={8} y={y(tick) + 4} className="axis-label">
            ${tick.toFixed(0)}
          </text>
        ))}
      </svg>

      {theoreticalData ? (
        <div className="pnl-legend">
          <span className="legend-item">
            <span className="legend-swatch theoretical-swatch" />
            {theoreticalLabel}
          </span>
          <span className="legend-item">
            <span className="legend-swatch expiration-swatch" />
            {expirationLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}
