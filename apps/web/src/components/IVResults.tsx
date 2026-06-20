import './IVResults.css';

interface IVResultsProps {
  iv: number;
  converged?: boolean;
}

export function IVResults({ iv, converged = true }: IVResultsProps) {
  return (
    <section className="results-panel card metrics-panel iv-results form-card">
      <h2>Results</h2>
      <div className="iv-result-card">
        <span className="iv-result-label">Implied Volatility</span>
        <span className="iv-result-value">{iv.toFixed(2)}%</span>
        {!converged ? (
          <p className="iv-warning">Did not converge — result may be inaccurate</p>
        ) : null}
      </div>
    </section>
  );
}
