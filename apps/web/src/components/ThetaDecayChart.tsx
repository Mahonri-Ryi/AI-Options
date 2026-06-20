import type { ThetaDecayChartData, ThetaDecayDetail } from '@ai-options/core';
import './ExpectedMoveChart.css';

interface ThetaDecayChartProps {
  data: ThetaDecayChartData;
  entryDte: number;
  detail?: ThetaDecayDetail;
}

export function ThetaDecayChart({ data, entryDte, detail }: ThetaDecayChartProps) {
  const { decayCurve, intrinsicLine } = data;
  if (decayCurve.length < 2) return null;

  const width = 480;
  const height = 260;
  const padding = { top: 16, right: 16, bottom: 48, left: 56 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const dtes = decayCurve.map((p) => p.dte);
  const prices = decayCurve.flatMap((p) => [p.optionPrice, p.intrinsicValue]);
  const minDte = 0;
  const maxDte = Math.max(...dtes);
  const minPrice = Math.max(0, Math.min(...prices) * 0.9);
  const maxPrice = Math.max(...prices) * 1.1;

  const x = (dte: number) =>
    padding.left + ((maxDte - dte) / (maxDte - minDte || 1)) * chartW;
  const y = (price: number) =>
    padding.top + chartH - ((price - minPrice) / (maxPrice - minPrice || 1)) * chartH;

  const optionPath = decayCurve
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.dte)} ${y(p.optionPrice)}`)
    .join(' ');
  const intrinsicPath = intrinsicLine
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.dte)} ${y(p.optionPrice)}`)
    .join(' ');
  const extrinsicPath = `${optionPath} ${intrinsicLine
    .slice()
    .reverse()
    .map((p) => `L ${x(p.dte)} ${y(p.optionPrice)}`)
    .join(' ')} Z`;

  const intrinsicValue = detail?.intrinsicValue ?? intrinsicLine[0]?.optionPrice ?? 0;
  const halfLife = detail?.extrinsicHalfLifeDays;

  return (
    <div className="theta-decay-chart chart-container">
      <svg viewBox={`0 0 ${width} ${height}`} className="theta-svg">
        <path d={extrinsicPath} className="theta-extrinsic-fill" />
        <path d={intrinsicPath} className="theta-intrinsic-line" fill="none" />
        <path d={optionPath} className="theta-option-line" fill="none" />

        <text x={padding.left} y={height - 12} className="axis-label">
          {entryDte} DTE
        </text>
        <text x={width - padding.right - 8} y={height - 12} className="axis-label" textAnchor="end">
          0 DTE
        </text>
        <text x={8} y={padding.top + 4} className="axis-label">
          ${maxPrice.toFixed(2)}
        </text>
        <text x={8} y={height - padding.bottom} className="axis-label">
          ${minPrice.toFixed(2)}
        </text>
      </svg>

      <div className="theta-legend">
        <span className="legend-item">
          <span className="legend-swatch theoretical-swatch" />
          Option Price
        </span>
        <span className="legend-item">
          <span className="legend-swatch em-swatch" />
          Extrinsic (Time) Value
        </span>
        <span className="legend-item">
          <span className="legend-dash theta-dash" />
          Intrinsic Value: ${intrinsicValue.toFixed(2)}
        </span>
        {halfLife != null ? (
          <span className="legend-item">
            <span className="legend-dash em-dash" />
            Extrinsic Half-Life: {halfLife} DTE
          </span>
        ) : null}
      </div>
    </div>
  );
}
