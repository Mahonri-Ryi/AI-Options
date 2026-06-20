import type { CalculatorResult, MetricItem } from '@ai-options/core';
import './ResultsPanel.css';

interface ResultsPanelProps {
  result: CalculatorResult | null;
}

function badgeClass(badge: MetricItem['badge']): string {
  if (!badge) return '';
  return `metric-badge ${badge.toLowerCase()}`;
}

function valueClass(variant?: MetricItem['variant']): string {
  if (variant === 'profit' || variant === 'positive') return 'profit';
  if (variant === 'loss' || variant === 'negative') return 'loss';
  return 'neutral';
}

function secondaryClass(variant?: MetricItem['secondaryVariant']): string {
  if (variant === 'profit' || variant === 'positive') return 'metric-secondary profit';
  if (variant === 'loss' || variant === 'negative') return 'metric-secondary loss';
  return 'metric-secondary';
}

function MetricValue({ item }: { item: MetricItem }) {
  return (
    <span className={`metric-value ${valueClass(item.variant)}`}>
      {item.value}
      {item.badge ? <span className={badgeClass(item.badge)}>{item.badge}</span> : null}
      {item.secondary ? (
        <span className={secondaryClass(item.secondaryVariant)}>
          {item.secondary.startsWith('(') || item.secondary.startsWith('+') || item.secondary.startsWith('-')
            ? ` ${item.secondary}`
            : ` (${item.secondary})`}
        </span>
      ) : null}
    </span>
  );
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
    <section className="results-panel card metrics-panel">
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
                    <span className={`metric-row-value ${valueClass(item.variant)}`}>
                      {item.value}
                      {item.secondary ? (
                        <span className={secondaryClass(item.secondaryVariant)}>
                          {' '}
                          {item.secondary}
                        </span>
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
                    <MetricValue item={item} />
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
