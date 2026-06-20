import type { MetricItem } from '@ai-options/core';

function variantClass(variant?: MetricItem['variant']): string {
  if (variant === 'profit' || variant === 'positive') return 'positive';
  if (variant === 'loss' || variant === 'negative') return 'negative';
  return '';
}

function secondaryVariantClass(variant?: MetricItem['secondaryVariant']): string {
  if (variant === 'profit' || variant === 'positive') return 'positive';
  if (variant === 'loss' || variant === 'negative') return 'negative';
  return '';
}

function formatSecondary(secondary: string): string {
  if (secondary.startsWith('(') || secondary.startsWith('+') || secondary.startsWith('-')) {
    return secondary;
  }
  if (secondary === 'debit' || secondary === 'credit') {
    return secondary;
  }
  return `(${secondary})`;
}

export function MetricValueDisplay({ item, compound = false }: { item: MetricItem; compound?: boolean }) {
  const valueClass = variantClass(item.variant);
  const secondaryClass = secondaryVariantClass(item.secondaryVariant);

  if (compound && item.secondary) {
    return (
      <span className="metric-value-compound">
        <span className={`metric-primary ${valueClass}`}>{item.value}</span>
        <span className={`metric-secondary ${secondaryClass}`}>{item.secondary}</span>
      </span>
    );
  }

  return (
    <span className={`metric-value ${valueClass}`}>
      {item.value}
      {item.badge ? <span className={`metric-badge ${item.badge.toLowerCase()}`}>{item.badge}</span> : null}
      {item.secondary ? (
        <span className={`metric-secondary ${secondaryClass}`}> {formatSecondary(item.secondary)}</span>
      ) : null}
      {item.note ? <span className="metric-note"> {item.note}</span> : null}
    </span>
  );
}
