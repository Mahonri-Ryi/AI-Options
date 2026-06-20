import type { PricingResult } from '@ai-options/core';
import './PricingResults.css';

interface PricingResultsProps {
  pricing: PricingResult;
}

export function PricingResults({ pricing }: PricingResultsProps) {
  const rows = [
    { label: 'Delta', call: pricing.callGreeks.delta, put: pricing.putGreeks.delta },
    { label: 'Gamma', call: pricing.callGreeks.gamma, put: pricing.putGreeks.gamma },
    { label: 'Theta', call: pricing.callGreeks.theta, put: pricing.putGreeks.theta },
    { label: 'Vega', call: pricing.callGreeks.vega, put: pricing.putGreeks.vega },
    { label: 'Rho', call: pricing.callGreeks.rho, put: pricing.putGreeks.rho },
  ];

  return (
    <section className="results-panel card metrics-panel pricing-results">
      <h2 className="results-title">Results</h2>
      <div className="prices-grid">
        <div className="price-card">
          <span className="price-card-label">CALL</span>
          <span className="price-card-value">${pricing.callPrice.toFixed(2)}</span>
        </div>
        <div className="price-card">
          <span className="price-card-label">PUT</span>
          <span className="price-card-value">${pricing.putPrice.toFixed(2)}</span>
        </div>
      </div>
      <h3 className="greeks-title">Greeks</h3>
      <table className="greeks-table">
        <thead>
          <tr>
            <th />
            <th>Call</th>
            <th>Put</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{row.call.toFixed(4)}</td>
              <td>{row.put.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
