import { useMemo, useState } from 'react';
import type { ExpectedMoveConePoint } from '@ai-options/core';
import './ExpectedMoveChart.css';

interface ExpectedMoveChartProps {
  cone: ExpectedMoveConePoint[];
  stockPrice: number;
  maxDte: number;
}

export function ExpectedMoveChart({ cone, stockPrice, maxDte }: ExpectedMoveChartProps) {
  const [descending, setDescending] = useState(true);

  const data = useMemo(
    () => (descending ? [...cone].reverse() : cone),
    [cone, descending],
  );

  if (data.length < 2) return null;

  const width = 480;
  const height = 260;
  const padding = { top: 16, right: 16, bottom: 48, left: 56 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const dtes = data.map((p) => p.dte);
  const prices = data.flatMap((p) => [p.upper, p.lower, stockPrice]);
  const minDte = Math.min(...dtes);
  const maxDteValue = Math.max(...dtes);
  const minPrice = Math.min(...prices) * 0.985;
  const maxPrice = Math.max(...prices) * 1.015;

  const x = (dte: number) =>
    padding.left + ((dte - minDte) / (maxDteValue - minDte || 1)) * chartW;
  const y = (price: number) =>
    padding.top + chartH - ((price - minPrice) / (maxPrice - minPrice || 1)) * chartH;

  const upperPath = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.dte)} ${y(p.upper)}`)
    .join(' ');
  const lowerPath = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.dte)} ${y(p.lower)}`)
    .join(' ');
  const conePath = `${upperPath} ${data
    .slice()
    .reverse()
    .map((p) => `L ${x(p.dte)} ${y(p.lower)}`)
    .join(' ')} Z`;
  const centerY = y(stockPrice);

  return (
    <div className="expected-move-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="em-svg">
        <line
          x1={padding.left}
          y1={centerY}
          x2={width - padding.right}
          y2={centerY}
          className="em-center-line"
        />
        <path d={conePath} className="em-cone-fill" />
        <path d={upperPath} className="em-boundary-line" fill="none" />
        <path d={lowerPath} className="em-boundary-line" fill="none" />

        <text x={padding.left} y={height - 12} className="axis-label">
          {descending ? `${maxDte} DTE` : '0 DTE'}
        </text>
        <text x={width - padding.right - 8} y={height - 12} className="axis-label" textAnchor="end">
          {descending ? '0 DTE' : `${maxDte} DTE`}
        </text>
        <text x={8} y={padding.top + 4} className="axis-label">
          ${maxPrice.toFixed(0)}
        </text>
        <text x={8} y={height - padding.bottom} className="axis-label">
          ${minPrice.toFixed(0)}
        </text>
      </svg>

      <div className="em-legend">
        <span className="legend-item">
          <span className="legend-swatch em-swatch" />
          Expected move cone (±1σ, 68.2%)
        </span>
        <span className="legend-item">
          <span className="legend-dash em-dash" />
          Current stock ${stockPrice.toFixed(2)}
        </span>
      </div>

      <div className="dte-direction-toggle" role="group" aria-label="Time axis direction">
        <button
          type="button"
          className={`dte-toggle-btn ${!descending ? 'active' : ''}`}
          onClick={() => setDescending(false)}
        >
          Ascending (0 → {maxDte})
        </button>
        <button
          type="button"
          className={`dte-toggle-btn ${descending ? 'active' : ''}`}
          onClick={() => setDescending(true)}
        >
          Descending ({maxDte} → 0)
        </button>
      </div>
    </div>
  );
}
