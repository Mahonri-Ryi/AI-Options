import { describe, expect, it } from 'vitest';
import {
  CALCULATOR_CONFIGS,
  CALCULATOR_FORM_META,
  computeCalculator,
  getCalculatorFormMeta,
  getDefaultValues,
  shouldShowFormField,
  STRATEGIES,
} from '../src/index.js';

const REFERENCE_VISUAL: Record<
  string,
  {
    panelTitle: string;
    submitLabel: string;
    visibleFieldLabels: string[];
    metricLabels?: string[];
    chartSeriesLabels?: string[];
    legendPrefixes?: string[];
    hasPositionToggle?: boolean;
    noChart?: boolean;
  }
> = {
  'long-call': {
    panelTitle: 'Option Parameters',
    submitLabel: 'Calculate P/L →',
    visibleFieldLabels: [
      'Stock Price',
      'Strike Price',
      'Days to Exp',
      'IV',
      'Rate',
      'Div Yield',
      'Quantity',
    ],
    metricLabels: [
      'Option Price',
      'Total Cost',
      'Intrinsic Value',
      'Extrinsic Value',
      'Breakeven',
      'Max Loss',
      'Delta (Δ)',
      'Theta (Θ)',
    ],
    chartSeriesLabels: ['Today (T+0)', 'At Expiration'],
    legendPrefixes: ['Entry Stock:', 'Strike:', 'Breakeven:'],
  },
  'bear-call-spread': {
    panelTitle: 'Spread Parameters',
    submitLabel: 'Calculate P/L →',
    visibleFieldLabels: [
      'Stock Price',
      'Short Strike',
      'Long Strike',
      'Days to Exp',
      'IV',
      'Rate',
      'Div Yield',
      'Quantity',
    ],
    metricLabels: [
      'Credit Received',
      'Total Credit',
      'Max Profit',
      'Max Loss',
      'Breakeven',
      'Max Return on Risk',
    ],
    chartSeriesLabels: ['Today (T+0)', 'At Expiration'],
    legendPrefixes: ['Stock:', 'Short Strike:', 'Long Strike:', 'B/E:'],
  },
  pmcc: {
    panelTitle: 'PMCC Parameters',
    submitLabel: 'Calculate P/L →',
    visibleFieldLabels: [
      'Long Strike',
      'Short Strike',
      'LC DTE',
      'SC DTE',
      'LC Price',
      'SC Price',
      'Stock Price',
      'Rate',
      'Div Yield',
      'Quantity',
    ],
    chartSeriesLabels: ['Today (T+0)'],
    legendPrefixes: ['Stock:', 'Long Call:', 'Short Call:'],
  },
  straddle: {
    panelTitle: 'Straddle Parameters',
    submitLabel: 'Calculate P/L →',
    visibleFieldLabels: ['Strike', 'Stock Price', 'Days to Exp', 'IV', 'Rate', 'Div Yield', 'Quantity'],
    hasPositionToggle: true,
    chartSeriesLabels: ['Today (T+0)', 'At Expiration'],
  },
  'options-pricing': {
    panelTitle: 'Pricing Parameters',
    submitLabel: 'Calculate Prices',
    visibleFieldLabels: [
      'Stock Price ($)',
      'Strike Price ($)',
      'Days to Expiration',
      'Implied Volatility (%)',
      'Risk-Free Rate (%)',
      'Dividend Yield (%)',
    ],
    noChart: true,
  },
  'implied-volatility': {
    panelTitle: 'IV Parameters',
    submitLabel: 'Calculate IV',
    visibleFieldLabels: [
      'Stock Price ($)',
      'Strike Price ($)',
      'Option Price ($)',
      'Days to Expiration',
      'Risk-Free Rate (%)',
      'Dividend Yield (%)',
    ],
    noChart: true,
  },
  'expected-move': {
    panelTitle: 'Expected Move Parameters',
    submitLabel: 'Calculate →',
    visibleFieldLabels: ['Stock Price', 'IV', 'Days to Exp'],
    noChart: false,
  },
  'theta-decay': {
    panelTitle: 'Option Parameters',
    submitLabel: 'Calculate →',
    visibleFieldLabels: ['Stock Price', 'Strike Price', 'Days to Exp', 'IV', 'Rate', 'Div Yield'],
    noChart: false,
  },
};

describe('visual parity — form metadata', () => {
  for (const strategy of STRATEGIES) {
    const ref = REFERENCE_VISUAL[strategy.id];
    if (!ref) continue;

    it(`${strategy.id}: panel title and submit label match reference`, () => {
      const meta = getCalculatorFormMeta(strategy.id);
      expect(meta.panelTitle).toBe(ref.panelTitle);
      expect(meta.submitLabel).toBe(ref.submitLabel);
      if (ref.hasPositionToggle) {
        expect(meta.hasPositionToggle).toBe(true);
      }
    });
  }
});

describe('visual parity — visible form fields', () => {
  for (const [id, ref] of Object.entries(REFERENCE_VISUAL)) {
    if (!ref.visibleFieldLabels.length) continue;

    it(`${id}: default visible field labels match reference`, () => {
      const defaults = getDefaultValues(id);
      const config = CALCULATOR_CONFIGS[id];
      const visible = config.fields
        .filter((f) => shouldShowFormField(id, f.key, defaults))
        .map((f) => f.label);
      expect(visible).toEqual(ref.visibleFieldLabels);
    });
  }
});

describe('visual parity — metrics and charts', () => {
  for (const [id, ref] of Object.entries(REFERENCE_VISUAL)) {
    it(`${id}: visualization structure matches reference`, () => {
      const defaults = getDefaultValues(id);
      const result = computeCalculator(id, defaults)!;
      const viz = result.visualization;

      if (ref.metricLabels?.length) {
        const labels =
          viz?.metricSections.flatMap((s) => s.items.map((i) => i.label)) ?? [];
        for (const label of ref.metricLabels) {
          expect(labels).toContain(label);
        }
      }

      if (ref.chartSeriesLabels?.length) {
        const seriesLabels = viz?.chartSeries.map((s) => s.label) ?? [];
        for (const label of ref.chartSeriesLabels) {
          expect(seriesLabels.some((s) => s.includes(label) || label.includes(s))).toBe(true);
        }
      }

      if (ref.legendPrefixes?.length) {
        const markerLabels = viz?.chartMarkers.map((m) => m.label ?? '') ?? [];
        for (const prefix of ref.legendPrefixes) {
          expect(markerLabels.some((l) => l.startsWith(prefix))).toBe(true);
        }
      }

      if (ref.noChart) {
        expect(result.curve.length).toBeLessThan(2);
      }
    });
  }
});

describe('visual parity — mode-specific fields', () => {
  it('long-call price mode shows Option Price field', () => {
    const values = { ...getDefaultValues('long-call'), calculationMode: 'price' };
    expect(shouldShowFormField('long-call', 'optionPrice', values)).toBe(true);
    expect(shouldShowFormField('long-call', 'iv', values)).toBe(false);
  });

  it('bear-call-spread price mode shows leg price fields', () => {
    const values = { ...getDefaultValues('bear-call-spread'), calculationMode: 'price' };
    expect(shouldShowFormField('bear-call-spread', 'longOptionPrice', values)).toBe(true);
    expect(shouldShowFormField('bear-call-spread', 'shortOptionPrice', values)).toBe(true);
    expect(shouldShowFormField('bear-call-spread', 'iv', values)).toBe(false);
  });

  it('pmcc hides global iv field', () => {
    const values = getDefaultValues('pmcc');
    expect(shouldShowFormField('pmcc', 'iv', values)).toBe(false);
    expect(shouldShowFormField('pmcc', 'longIv', { ...values, calculationMode: 'iv' })).toBe(true);
  });

  it('straddle short position shows net credit not net debit', () => {
    const values = { ...getDefaultValues('straddle'), calculationMode: 'price', positionType: 'short' };
    expect(shouldShowFormField('straddle', 'netPremiumInput', values)).toBe(true);
    expect(shouldShowFormField('straddle', 'optionPrice', values)).toBe(false);
  });

  it('every calculator has form metadata', () => {
    for (const strategy of STRATEGIES) {
      expect(CALCULATOR_FORM_META[strategy.id]).toBeDefined();
    }
  });
});

describe('visual parity — spread price mode leg IV metrics', () => {
  it('bear-call-spread price mode includes per-leg IV labels', () => {
    const values = { ...getDefaultValues('bear-call-spread'), calculationMode: 'price' };
    const result = computeCalculator('bear-call-spread', values)!;
    const labels = result.visualization!.metricSections.flatMap((s) => s.items.map((i) => i.label));
    expect(labels).toContain('Short Call IV');
    expect(labels).toContain('Long Call IV');
  });
});

describe('visual parity — long call badges and breakeven', () => {
  it('long-call includes moneyness badge and debit label', () => {
    const result = computeCalculator('long-call', getDefaultValues('long-call'))!;
    const items = result.visualization!.metricSections.flatMap((s) => s.items);
    const optionPrice = items.find((i) => i.label === 'Option Price');
    const totalCost = items.find((i) => i.label === 'Total Cost');
    expect(optionPrice?.badge).toBe('OTM');
    expect(totalCost?.secondary).toBe('debit');
  });
});
