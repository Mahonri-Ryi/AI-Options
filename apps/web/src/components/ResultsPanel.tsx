import type { CalculatorResult } from '@ai-options/core';
import './ResultsPanel.css';

function formatMoney(value: number | 'unlimited'): string {
  if (value === 'unlimited') return 'Unlimited';
  const prefix = value >= 0 ? '$' : '-$';
  return `${prefix}${Math.abs(value).toFixed(2)}`;
}

interface ResultsPanelProps {
  result: CalculatorResult | null;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  if (!result) {
    return (
      <div className="results-empty card">
        <p>Enter parameters and calculate to see results.</p>
      </div>
    );
  }

  const { metrics } = result;

  return (
    <section className="results-panel card">
      <h2 className="results-title">Key Metrics</h2>
      <div className="metrics-grid">
        <div className="metric">
          <span className="metric-label">Max Profit</span>
          <span className="metric-value profit">{formatMoney(metrics.maxProfit)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Max Loss</span>
          <span className="metric-value loss">{formatMoney(metrics.maxLoss)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Premium</span>
          <span className="metric-value">${metrics.premium.toFixed(2)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Breakeven</span>
          <span className="metric-value">
            {metrics.breakevens.length
              ? metrics.breakevens.map((b) => `$${b.toFixed(2)}`).join(' / ')
              : 'N/A'}
          </span>
        </div>
      </div>

      {result.greeks ? (
        <>
          <h3 className="greeks-title">Greeks</h3>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Delta</span>
              <span className="metric-value">{result.greeks.delta.toFixed(3)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Gamma</span>
              <span className="metric-value">{result.greeks.gamma.toFixed(4)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Theta</span>
              <span className="metric-value">{result.greeks.theta.toFixed(3)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Vega</span>
              <span className="metric-value">{result.greeks.vega.toFixed(3)}</span>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
