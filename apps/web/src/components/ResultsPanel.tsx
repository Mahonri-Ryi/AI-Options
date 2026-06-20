import type { CalculatorResult, MetricItem, MetricSection } from '@ai-options/core';
import { MetricValueDisplay } from './MetricValueDisplay';
import './ResultsPanel.css';

interface ResultsPanelProps {
  result: CalculatorResult | null;
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

function MetricsRows({ items }: { items: MetricItem[] }) {
  return (
    <>
      {items.map((item) => (
        <div key={item.label} className="metric-row">
          <span className="metric-label">{item.label}</span>
          <MetricValueDisplay item={item} compound />
        </div>
      ))}
    </>
  );
}

function MetricsSectionBlock({ section }: { section: MetricSection }) {
  const isScenarioSection = section.layout === 'rows' && Boolean(section.title);

  if (isScenarioSection) {
    return (
      <div className="metrics-section profit-scenarios">
        <div className="metrics-section-header">{section.title}</div>
        <MetricsRows items={section.items} />
      </div>
    );
  }

  return (
    <div className="metrics-section">
      {section.title ? <div className="section-note">{section.title}</div> : null}
      <MetricsGrid items={section.items} />
    </div>
  );
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  if (!result) {
    return (
      <div className="form-card metrics-panel card">
        <h2>Key Metrics</h2>
        <div className="results-placeholder">
          <p>Enter parameters and calculate to see results.</p>
        </div>
      </div>
    );
  }

  const sections = result.visualization?.metricSections ?? [];

  if (!sections.length) {
    return (
      <div className="form-card metrics-panel card">
        <h2>Key Metrics</h2>
        <div className="results-placeholder">
          <p>No metrics available.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="form-card metrics-panel card">
      <h2>Key Metrics</h2>
      <div className="metrics-content">
        {sections.map((section, sectionIndex) => (
          <MetricsSectionBlock key={`${section.title ?? 'section'}-${sectionIndex}`} section={section} />
        ))}
      </div>
    </section>
  );
}
