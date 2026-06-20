import type { CalculatorResult } from '@ai-options/core';
import './ResultsPanel.css';

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

  const sections = result.visualization?.metricSections ?? [];

  if (!sections.length) {
    return (
      <div className="results-empty card">
        <p>No metrics available.</p>
      </div>
    );
  }

  return (
    <section className="results-panel card">
      <h2 className="results-title">Key Metrics</h2>
      <div className="metrics-content">
        {sections.map((section, sectionIndex) => (
          <div key={`${section.title ?? 'section'}-${sectionIndex}`} className="metrics-section">
            {section.title ? <h3 className="metrics-section-header">{section.title}</h3> : null}
            {section.layout === 'rows' ? (
              <div className="metrics-rows">
                {section.items.map((item) => (
                  <div key={item.label} className="metric-row">
                    <span className="metric-row-label">{item.label}</span>
                    <span className={`metric-row-value ${item.variant ?? 'neutral'}`}>
                      {item.value}
                      {item.secondary ? (
                        <span className="metric-secondary"> {item.secondary}</span>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="metrics-grid">
                {section.items.map((item) => (
                  <div key={item.label} className="metric">
                    <span className="metric-label">{item.label}</span>
                    <span className={`metric-value ${item.variant ?? 'neutral'}`}>
                      {item.value}
                      {item.secondary ? (
                        <span className="metric-secondary"> {item.secondary}</span>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
