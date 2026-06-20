import type { ExpectedMoveDetail, ThetaDecayDetail, MetricItem } from '@ai-options/core';
import { MetricValueDisplay } from './MetricValueDisplay';
import './ResultsPanel.css';

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

function MetricsGrid({ items }: { items: MetricItem[] }) {
  return (
    <div className="metrics-grid">
      {items.map((item) => (
        <div key={item.label} className="metric-item">
          <span className="metric-label">{item.label}</span>
          <MetricValueDisplay item={item} />
        </div>
      ))}
    </div>
  );
}

export function ExpectedMoveResults({
  detail,
  stockPrice,
}: {
  detail: ExpectedMoveDetail;
  stockPrice: number;
}) {
  const movePct = ((detail.expectedMove / stockPrice) * 100).toFixed(1);
  const items: MetricItem[] = [
    {
      label: 'Expected Move',
      value: `±${formatMoney(detail.expectedMove)}`,
      secondary: `(${movePct}%)`,
    },
    { label: 'Upper Bound', value: formatMoney(detail.upperBound), variant: 'profit' },
    { label: 'Lower Bound', value: formatMoney(detail.lowerBound), variant: 'loss' },
    { label: 'Daily Move', value: `±${formatMoney(detail.dailyMove)}` },
    { label: 'Weekly Move', value: `±${formatMoney(detail.weeklyMove)}` },
  ];

  return (
    <section className="form-card metrics-panel card">
      <h2>Expected Move</h2>
      <div className="metrics-content">
        <div className="metrics-section">
          <MetricsGrid items={items} />
        </div>
      </div>
    </section>
  );
}

export function ThetaDecayResults({ detail }: { detail: ThetaDecayDetail }) {
  const items: MetricItem[] = [
    {
      label: 'Entry Price',
      value: formatMoney(detail.entryPrice),
      badge: detail.moneyness,
    },
    { label: 'Expiration Value', value: formatMoney(detail.expirationValue) },
    { label: 'Intrinsic Value', value: formatMoney(detail.intrinsicValue) },
    {
      label: 'Extrinsic Value',
      value: formatMoney(detail.extrinsicValue),
      secondary: `(${detail.entryPrice > 0 ? ((detail.extrinsicValue / detail.entryPrice) * 100).toFixed(0) : 0}%)`,
    },
    {
      label: 'Initial Theta',
      value: detail.currentTheta.toFixed(3),
      variant: 'loss',
    },
    {
      label: 'Extrinsic Half-Life',
      value:
        detail.extrinsicHalfLifeDays != null
          ? `${detail.extrinsicHalfLifeDays} DTE`
          : 'N/A',
      secondary:
        detail.extrinsicHalfLifeDays != null
          ? `(${Math.round(((detail.entryDte - detail.extrinsicHalfLifeDays) / detail.entryDte) * 100)}% elapsed)`
          : undefined,
    },
  ];

  return (
    <section className="form-card metrics-panel card">
      <h2>Key Metrics</h2>
      <div className="metrics-content">
        <div className="metrics-section">
          <MetricsGrid items={items} />
        </div>
      </div>
    </section>
  );
}
