export type MetricColorVariant = 'positive' | 'negative' | 'neutral';

export interface FormattedMetricValue {
  text: string;
  variant: MetricColorVariant;
}

function currencyCompact(absValue: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(Math.round(absValue)));
}

function currencyPremium(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function fmtPremium(value: number): string {
  return currencyPremium(value);
}

export function fmtCompactMoney(value: number): string {
  return currencyCompact(value);
}

export function fmtSignedCompactMoney(value: number): FormattedMetricValue {
  const formatted = currencyCompact(value);
  return {
    text: value >= 0 ? `+${formatted}` : `-${formatted}`,
    variant: value >= 0 ? 'positive' : value < 0 ? 'negative' : 'neutral',
  };
}

export function fmtPercentChange(target: number, base: number): FormattedMetricValue {
  if (base === 0) {
    return { text: '(0.0%)', variant: 'neutral' };
  }
  const pct = ((target - base) / base) * 100;
  const absPct = Math.abs(pct);
  let digits: string;
  if (absPct >= 100) {
    digits = Math.round(absPct).toLocaleString('en-US');
  } else if (absPct < 10) {
    digits = absPct.toFixed(2);
  } else {
    digits = absPct.toFixed(1);
  }
  const isZero = parseFloat(digits) === 0;
  const sign = isZero ? '' : pct >= 0 ? '+' : '-';
  const variant: MetricColorVariant = isZero ? 'neutral' : pct >= 0 ? 'positive' : 'negative';
  return { text: `(${sign}${digits}%)`, variant };
}

export function fmtSignedPct(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function fmtSignedDelta(value: number): FormattedMetricValue {
  const sign = value >= 0 ? '+' : '';
  return {
    text: `${sign}${value.toFixed(2)}`,
    variant: value >= 0 ? 'positive' : 'negative',
  };
}

export function fmtSignedGamma(value: number): FormattedMetricValue {
  const sign = value >= 0 ? '+' : '';
  return {
    text: `${sign}${value.toFixed(4)}`,
    variant: value >= 0 ? 'positive' : 'negative',
  };
}

export function fmtSignedThetaPerDay(value: number): FormattedMetricValue {
  const rounded = Math.round(value);
  const formatted = currencyCompact(rounded);
  return {
    text: rounded >= 0 ? `+${formatted}/day` : `-${formatted}/day`,
    variant: rounded >= 0 ? 'positive' : 'negative',
  };
}

export function fmtSignedVega(value: number): FormattedMetricValue {
  const rounded = Math.round(value);
  const sign = rounded >= 0 ? '+' : '';
  return {
    text: `${sign}${rounded}`,
    variant: rounded >= 0 ? 'positive' : 'negative',
  };
}

export function fmtDeltaWithPerContract(
  perContractDelta: number,
  quantity: number,
): { value: string; secondary: string; variant: MetricColorVariant } {
  const shares = quantity * 100;
  const positionDelta = perContractDelta * shares;
  const signed = fmtSignedDelta(positionDelta);
  const perOptionSign = perContractDelta >= 0 ? '+' : '';
  return {
    value: signed.text,
    secondary: `(${perOptionSign}${perContractDelta.toFixed(3)}/contract)`,
    variant: signed.variant,
  };
}

export function fmtThetaPerDay(value: number): string {
  return `${currencyPremium(value)}/day`;
}

export function toMetricVariant(
  variant: MetricColorVariant,
): 'profit' | 'loss' | 'positive' | 'negative' | 'neutral' {
  if (variant === 'positive') return 'positive';
  if (variant === 'negative') return 'negative';
  return 'neutral';
}
