import { useCallback, useMemo, useRef, useState } from 'react';
import type { CalculatorVisualization, ChartAxes, PnLPoint } from '@ai-options/core';
import './PnLChart.css';

interface PnLChartProps {
  visualization?: CalculatorVisualization;
  data?: PnLPoint[];
  theoreticalData?: PnLPoint[];
  currentPrice?: number;
  chartAxes?: ChartAxes;
}

function interpolatePnL(curve: PnLPoint[], stockPrice: number): number {
  if (!curve.length) return 0;
  if (stockPrice <= curve[0].stockPrice) return curve[0].pnl;
  if (stockPrice >= curve[curve.length - 1].stockPrice) return curve[curve.length - 1].pnl;
  for (let i = 1; i < curve.length; i++) {
    const prev = curve[i - 1];
    const curr = curve[i];
    if (stockPrice >= prev.stockPrice && stockPrice <= curr.stockPrice) {
      const ratio = (stockPrice - prev.stockPrice) / (curr.stockPrice - prev.stockPrice || 1);
      return prev.pnl + ratio * (curr.pnl - prev.pnl);
    }
  }
  return curve[curve.length - 1].pnl;
}

export function PnLChart({
  visualization,
  data,
  theoreticalData,
  chartAxes,
}: PnLChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{
    stockPrice: number;
    x: number;
    pnls: Array<{ label: string; pnl: number; style: string }>;
  } | null>(null);

  const series = useMemo(() => {
    if (visualization?.chartSeries.length) return visualization.chartSeries;
    const fallback = [];
    if (theoreticalData?.length) {
      fallback.push({
        id: 'theoretical',
        label: 'Today (T+0)',
        data: theoreticalData,
        style: 'theoretical' as const,
      });
    }
    if (data?.length) {
      fallback.push({
        id: 'expiration',
        label: 'At Expiration',
        data,
        style: 'expiration' as const,
      });
    }
    return fallback;
  }, [visualization, data, theoreticalData]);

  const markers = visualization?.chartMarkers ?? [];
  const chartTitleShort = visualization?.chartTitleShort ?? visualization?.chartTitle;
  const chartSubtitle = visualization?.chartSubtitle;

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || series.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      const width = 480;
      const padding = { top: 16, right: 12, bottom: 40, left: 56 };
      const chartW = width - padding.left - padding.right;
      const allPrices = series.flatMap((s) => s.data.map((d) => d.stockPrice));
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      const priceRange = maxPrice - minPrice || 1;
      const relativeX = ((event.clientX - rect.left) / rect.width) * width;
      const stockPrice = minPrice + ((relativeX - padding.left) / chartW) * priceRange;
      const clampedPrice = Math.max(minPrice, Math.min(maxPrice, stockPrice));
      const pnls = series.map((s) => ({
        label: s.label,
        pnl: interpolatePnL(s.data, clampedPrice),
        style: s.style,
      }));
      setHover({
        stockPrice: clampedPrice,
        x: relativeX,
        pnls,
      });
    },
    [series],
  );

  if (series.length === 0 || series.every((s) => s.data.length < 2)) return null;

  const width = 480;
  const height = 280;
  const padding = { top: 16, right: 12, bottom: 40, left: 56 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allPrices = series.flatMap((s) => s.data.map((d) => d.stockPrice));
  const allPnls = series.flatMap((s) => s.data.map((d) => d.pnl));
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const [yMin, yMax] = chartAxes?.yDomain ?? [Math.min(...allPnls, 0), Math.max(...allPnls, 0)];
  const pnlRange = yMax - yMin || 1;
  const priceRange = maxPrice - minPrice || 1;

  const x = (price: number) => padding.left + ((price - minPrice) / priceRange) * chartW;
  const y = (pnl: number) => padding.top + chartH - ((pnl - yMin) / pnlRange) * chartH;
  const zeroY = y(0);

  const xTicks = chartAxes?.xTicks ?? [minPrice, maxPrice];
  const yTicks = chartAxes?.yTicks ?? [yMax, yMin];

  const buildPath = (curve: PnLPoint[]) =>
    curve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.stockPrice)} ${y(p.pnl)}`).join(' ');

  const expirationSeries = series.find((s) => s.style === 'expiration') ?? series[series.length - 1];
  const areaPath = expirationSeries
    ? `${buildPath(expirationSeries.data)} L ${x(expirationSeries.data[expirationSeries.data.length - 1].stockPrice)} ${y(0)} L ${x(expirationSeries.data[0].stockPrice)} ${y(0)} Z`
    : '';

  const markerColor = (type: string) => {
    if (type === 'current') return 'rgba(255, 255, 255, 0.5)';
    if (type === 'breakeven') return 'rgba(45, 243, 176, 0.7)';
    if (type === 'strike') return '#f59e0b';
    if (type === 'longStrike') return '#a78bfa';
    if (type === 'shortStrike') return '#ff6b6b';
    return 'rgba(255, 255, 255, 0.35)';
  };

  const formatPnL = (value: number) => {
    const prefix = value >= 0 ? '$' : '-$';
    return `${prefix}${Math.abs(value).toFixed(2)}`;
  };

  return (
    <div className="pnl-chart chart-container">
      {chartTitleShort ? (
        <div className="chart-header">
          <span className="chart-title-bold">{chartTitleShort}:</span>
          {chartSubtitle ? (
            <span className="chart-title-details"> {chartSubtitle}</span>
          ) : hover ? (
            <span className="chart-title-details"> ${hover.stockPrice.toFixed(2)} stock</span>
          ) : null}
        </div>
      ) : null}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="pnl-svg"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
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

        {areaPath ? <path d={areaPath} fill="url(#pnlGradient)" /> : null}

        {series.map((s) => (
          <path
            key={s.id}
            d={buildPath(s.data)}
            className={`pnl-line ${s.style}-line`}
            fill="none"
          />
        ))}

        {markers.map((marker) => (
          <line
            key={`${marker.type}-${marker.value}`}
            x1={x(marker.value)}
            y1={padding.top}
            x2={x(marker.value)}
            y2={height - padding.bottom}
            className={`marker-line marker-${marker.type}`}
            stroke={marker.color ?? markerColor(marker.type)}
          />
        ))}

        {hover ? (
          <>
            <line
              x1={hover.x}
              y1={padding.top}
              x2={hover.x}
              y2={height - padding.bottom}
              className="hover-line"
            />
            <circle cx={hover.x} cy={zeroY} r={4} className="price-dot" />
          </>
        ) : null}

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

      {hover ? (
        <div className="chart-tooltip">
          <div className="tooltip-row">
            <span>Stock:</span>
            <span>${hover.stockPrice.toFixed(2)}</span>
          </div>
          {hover.pnls.map((item) => (
            <div key={item.label} className={`tooltip-row tooltip-${item.style}`}>
              <span>{item.label}:</span>
              <span className={item.pnl >= 0 ? 'profit' : 'loss'}>{formatPnL(item.pnl)}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="pnl-legend">
        {series.map((s) => (
          <span key={s.id} className={`legend-item ${s.style === 'stock' ? 'long-stock' : ''}`}>
            <span className={`legend-line ${s.style}-line`} />
            <span className="legend-label">{s.label}</span>
          </span>
        ))}
        {markers.length ? <span className="legend-divider" /> : null}
        {markers.map((marker) => (
          <span key={`legend-${marker.type}-${marker.value}`} className="legend-item">
            <span
              className={`legend-dash marker-${marker.type}`}
              style={marker.color ? { borderTopColor: marker.color } : undefined}
            />
            <span className="legend-label">{marker.label}</span>
          </span>
        ))}
      </div>

      {visualization?.chartNote ? (
        <p className="chart-model-note">{visualization.chartNote}</p>
      ) : null}
    </div>
  );
}
