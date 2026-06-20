import type { ExpectedMoveDetail, ThetaDecayDetail } from '@ai-options/core';
import './SpecialResultsPanel.css';

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function ExpectedMoveResults({
  detail,
  stockPrice,
}: {
  detail: ExpectedMoveDetail;
  stockPrice: number;
}) {
  const movePct = ((detail.expectedMove / stockPrice) * 100).toFixed(1);
  return (
    <section className="results-panel card special-results metrics-panel">
      <h2 className="results-title">Expected Move</h2>
      <div className="metrics-grid">
        <div className="metric">
          <span className="metric-label">Expected Move</span>
          <span className="metric-value">
            ±{formatMoney(detail.expectedMove)}{' '}
            <span className="metric-secondary">({movePct}%)</span>
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Upper Bound</span>
          <span className="metric-value profit">{formatMoney(detail.upperBound)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Lower Bound</span>
          <span className="metric-value loss">{formatMoney(detail.lowerBound)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Daily Move</span>
          <span className="metric-value">±{formatMoney(detail.dailyMove)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Weekly Move</span>
          <span className="metric-value">±{formatMoney(detail.weeklyMove)}</span>
        </div>
      </div>
    </section>
  );
}

export function ThetaDecayResults({ detail }: { detail: ThetaDecayDetail }) {
  return (
    <section className="results-panel card special-results metrics-panel">
      <h2 className="results-title">Key Metrics</h2>
      <div className="metrics-grid">
        <div className="metric">
          <span className="metric-label">Entry Price</span>
          <span className="metric-value">
            {formatMoney(detail.entryPrice)}
            <span className={`metric-badge ${detail.moneyness.toLowerCase()}`}>
              {detail.moneyness}
            </span>
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Expiration Value</span>
          <span className="metric-value">{formatMoney(detail.expirationValue)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Intrinsic Value</span>
          <span className="metric-value">{formatMoney(detail.intrinsicValue)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Extrinsic Value</span>
          <span className="metric-value">
            {formatMoney(detail.extrinsicValue)}
            <span className="metric-secondary">
              ({detail.entryPrice > 0 ? ((detail.extrinsicValue / detail.entryPrice) * 100).toFixed(0) : 0}%)
            </span>
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Initial Theta</span>
          <span className="metric-value loss">{detail.currentTheta.toFixed(3)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Extrinsic Half-Life</span>
          <span className="metric-value">
            {detail.extrinsicHalfLifeDays != null ? (
              <>
                {detail.extrinsicHalfLifeDays} DTE
                <span className="metric-secondary">
                  ({Math.round(((detail.entryDte - detail.extrinsicHalfLifeDays) / detail.entryDte) * 100)}% elapsed)
                </span>
              </>
            ) : (
              'N/A'
            )}
          </span>
        </div>
      </div>
    </section>
  );
}
