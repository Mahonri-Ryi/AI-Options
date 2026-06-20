import type {
  CalculatorResult,
  CalculatorVisualization,
  ChartMarker,
  ChartSeries,
  MetricItem,
  MetricSection,
} from './types.js';
import { CALCULATOR_CONFIGS } from './calculator-configs.js';
import { impliedVolatility } from './math/volatility.js';

function num(values: Record<string, string>, key: string, fallback = 0): number {
  const parsed = Number(values[key]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function fmtMoney(value: number | 'unlimited'): string {
  if (value === 'unlimited') return 'Unlimited';
  const prefix = value >= 0 ? '$' : '-$';
  return `${prefix}${Math.abs(value).toFixed(2)}`;
}

function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function fmtPremium(value: number): string {
  return `$${value.toFixed(2)}`;
}

function gridSection(title: string | undefined, items: MetricItem[]): MetricSection {
  return { title, layout: 'grid', items };
}

function rowSection(title: string, items: MetricItem[]): MetricSection {
  return { title, layout: 'rows', items };
}

function buildChartSeries(
  result: CalculatorResult,
  options: {
    theoreticalLabel?: string;
    expirationLabel?: string;
    quantity?: number;
  } = {},
): ChartSeries[] {
  const series: ChartSeries[] = [];
  if (result.theoreticalCurve?.length) {
    series.push({
      id: 'theoretical',
      label: options.theoreticalLabel ?? 'Today (T+0)',
      data: result.theoreticalCurve,
      style: 'theoretical',
    });
  }
  if (result.curve.length) {
    series.push({
      id: 'expiration',
      label: options.expirationLabel ?? 'At Expiration',
      data: result.curve,
      style: 'expiration',
    });
  }
  if (result.stockComparisonCurve?.length) {
    const shares = (options.quantity ?? 1) * 100;
    series.push({
      id: 'stock',
      label: `${shares.toLocaleString('en-US')} shares`,
      data: result.stockComparisonCurve,
      style: 'stock',
    });
  }
  return series;
}

function moneyness(
  stockPrice: number,
  strike: number,
  type: 'call' | 'put',
): 'ITM' | 'ATM' | 'OTM' {
  if (Math.abs(stockPrice - strike) / strike < 0.02) return 'ATM';
  if (type === 'call') return stockPrice > strike ? 'ITM' : 'OTM';
  return stockPrice < strike ? 'ITM' : 'OTM';
}

function pctChange(from: number, to: number): string {
  if (from === 0) return '0.0%';
  const pct = ((to - from) / from) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function buildChartSubtitle(
  calculatorId: string,
  values: Record<string, string>,
  result: CalculatorResult,
): string {
  const strike = num(values, 'strike');
  const dte = num(values, 'dte');
  const premium = result.metrics.premium;
  switch (calculatorId) {
    case 'long-call':
      return `${strike} Call @ ${fmtPremium(premium)} (${dte} DTE)`;
    case 'long-put':
      return `${strike} Put @ ${fmtPremium(premium)} (${dte} DTE)`;
    case 'short-call':
      return `${strike} Call @ ${fmtPremium(premium)} (${dte} DTE)`;
    case 'short-put':
      return `${strike} Put @ ${fmtPremium(premium)} (${dte} DTE)`;
    case 'covered-call':
      return `${strike} Call @ ${fmtPremium(premium)} (${dte} DTE)`;
    case 'cash-secured-put':
      return `${strike} Put @ ${fmtPremium(premium)} (${dte} DTE)`;
    case 'pmcc':
      return `${num(values, 'longStrike')} / ${num(values, 'shortStrike')} (${num(values, 'shortDte')} DTE short)`;
    default:
      return '';
  }
}

const CHART_TITLE_SHORT: Record<string, string> = {
  'long-call': 'Long',
  'long-put': 'Long',
  'short-call': 'Short Call',
  'short-put': 'Short Put',
  'bull-call-spread': 'Bull Call Spread',
  'bull-put-spread': 'Bull Put Spread',
  'bear-put-spread': 'Bear Put Spread',
  'bear-call-spread': 'Bear Call Spread',
  'covered-call': 'Covered Call',
  'cash-secured-put': 'Cash-Secured Put',
  pmcc: 'PMCC',
  straddle: 'Straddle',
  strangle: 'Strangle',
  'iron-condor': 'Iron Condor',
  'iron-butterfly': 'Iron Butterfly',
};

function buildMarkers(
  values: Record<string, string>,
  result: CalculatorResult,
  options: {
    strike?: number;
    strikeLabel?: string;
    longStrike?: number;
    shortStrike?: number;
    longDte?: number;
    shortDte?: number;
    longPremium?: number;
    shortPremium?: number;
    skipLegMarkers?: boolean;
    entryStockLabel?: boolean;
    breakevenShortLabel?: boolean;
    skipBreakevenMarkers?: boolean;
  } = {},
): ChartMarker[] {
  const markers: ChartMarker[] = [];
  const stockPrice = num(values, 'stockPrice');
  if (stockPrice > 0) {
    markers.push({
      type: 'current',
      value: stockPrice,
      label: options.entryStockLabel
        ? `Entry Stock: $${stockPrice.toFixed(2)}`
        : `Stock: $${stockPrice.toFixed(2)}`,
      color: 'rgba(255,255,255,0.5)',
    });
  }
  if (options.strike !== undefined) {
    markers.push({
      type: 'strike',
      value: options.strike,
      label: `${options.strikeLabel ?? 'Strike'}: $${options.strike.toFixed(0)}`,
      color: '#f59e0b',
    });
  }
  if (options.longStrike !== undefined && !options.skipLegMarkers) {
    markers.push({
      type: 'longStrike',
      value: options.longStrike,
      label: `Long Strike: $${options.longStrike.toFixed(0)}`,
    });
  }
  if (options.shortStrike !== undefined && !options.skipLegMarkers) {
    markers.push({
      type: 'shortStrike',
      value: options.shortStrike,
      label: `Short Strike: $${options.shortStrike.toFixed(0)}`,
    });
  }
  const bePrefix = options.breakevenShortLabel ? 'B/E' : 'Breakeven';
  if (!options.skipBreakevenMarkers) {
    for (const breakeven of result.metrics.breakevens) {
      markers.push({
        type: 'breakeven',
        value: breakeven,
        label: `${bePrefix}: $${breakeven.toFixed(2)}`,
        color: '#2df3b0',
      });
    }
  }
  return markers;
}

function longLegMetrics(
  result: CalculatorResult,
  values: Record<string, string>,
  type: 'call' | 'put',
): MetricSection[] {
  const stockPrice = num(values, 'stockPrice');
  const strike = num(values, 'strike');
  const premium = result.metrics.premium;
  const intrinsic =
    type === 'call' ? Math.max(0, stockPrice - strike) : Math.max(0, strike - stockPrice);
  const extrinsic = Math.max(0, premium - intrinsic);
  const totalCost = premium * 100 * num(values, 'quantity', 1);
  const maxLossPct = totalCost > 0 ? (totalCost / totalCost) * 100 : 100;

  const quantity = num(values, 'quantity', 1);
  const badge = moneyness(stockPrice, strike, type);
  const breakeven = result.metrics.breakevens[0] ?? strike + premium;

  const sections: MetricSection[] = [
    gridSection(undefined, [
      {
        label: 'Option Price',
        value: fmtPremium(premium),
        badge,
      },
      {
        label: 'Total Cost',
        value: fmtMoney(totalCost),
        secondary: 'debit',
      },
    ]),
    gridSection(undefined, [
      {
        label: 'Intrinsic Value',
        value: fmtPremium(intrinsic),
        secondary: fmtMoney(intrinsic * 100 * quantity),
      },
      {
        label: 'Extrinsic Value',
        value: fmtPremium(extrinsic),
        secondary: fmtMoney(extrinsic * 100 * quantity),
      },
      {
        label: 'Breakeven',
        value: `$${breakeven.toFixed(2)}`,
        secondary: pctChange(stockPrice, breakeven),
      },
      {
        label: 'Max Loss',
        value: fmtMoney(result.metrics.maxLoss as number),
        secondary: '(100%)',
        variant: 'loss',
      },
    ]),
  ];

  if (result.greeks) {
    const greeksItems: MetricItem[] = [
      {
        label: 'Delta (Δ)',
        value: result.greeks.delta.toFixed(3),
        secondary: `(${(result.greeks.delta / quantity).toFixed(3)}/contract)`,
      },
      {
        label: 'Theta (Θ)',
        value: `${result.greeks.theta.toFixed(3)}/day`,
      },
      {
        label: 'Implied Vol',
        value: `${num(values, 'iv', 25).toFixed(1)}%`,
      },
    ];
    sections.push(gridSection('Greeks at Entry', greeksItems));
  }

  return sections;
}

function shortLegMetrics(
  result: CalculatorResult,
  values: Record<string, string>,
  quantity: number,
): MetricSection[] {
  const sections: MetricSection[] = [
    gridSection(undefined, [
      { label: 'Credit Received', value: fmtMoney(result.metrics.premium * 100 * quantity) },
      {
        label: 'Implied Volatility',
        value: `${num(values, 'iv', 25).toFixed(1)}%`,
      },
      {
        label: 'Max Profit',
        value: fmtMoney(result.metrics.maxProfit),
        variant: 'profit',
      },
      {
        label: 'Max Loss',
        value: fmtMoney(result.metrics.maxLoss),
        variant: 'loss',
      },
      {
        label: 'Breakeven',
        value: result.metrics.breakevens.length
          ? `$${result.metrics.breakevens[0].toFixed(2)}`
          : 'N/A',
      },
    ]),
  ];

  if (result.greeks) {
    sections.push(
      gridSection('Greeks at Entry', [
        { label: 'Delta (Δ)', value: result.greeks.delta.toFixed(3) },
        { label: 'Gamma (Γ)', value: result.greeks.gamma.toFixed(4) },
        { label: 'Theta (Θ)', value: result.greeks.theta.toFixed(3) },
        { label: 'Vega (ν)', value: result.greeks.vega.toFixed(3) },
      ]),
    );
  }

  return sections;
}

function spreadMetrics(
  result: CalculatorResult,
  values: Record<string, string>,
  isCredit: boolean,
  calculatorId: string,
): MetricSection[] {
  const quantity = num(values, 'quantity', 1);
  const net = Math.abs(result.metrics.netPremium);
  const total = net * 100 * quantity;
  const maxReturn =
    typeof result.metrics.maxLoss === 'number' && result.metrics.maxLoss > 0
      ? ((result.metrics.maxProfit as number) / result.metrics.maxLoss) * 100
      : 0;

  const items: MetricItem[] = [
    {
      label: isCredit ? 'Credit Received' : 'Spread Price',
      value: fmtPremium(net),
    },
    {
      label: isCredit ? 'Total Credit' : 'Total Cost',
      value: fmtMoney(total),
    },
    {
      label: 'Max Profit',
      value: fmtMoney(result.metrics.maxProfit),
      variant: 'profit',
    },
    {
      label: 'Max Loss',
      value: fmtMoney(result.metrics.maxLoss),
      variant: 'loss',
    },
    {
      label: 'Breakeven',
      value: result.metrics.breakevens.length
        ? `$${result.metrics.breakevens[0].toFixed(2)}`
        : 'N/A',
    },
    {
      label: 'Max Return on Risk',
      value: fmtPct(maxReturn),
      variant: maxReturn >= 0 ? 'profit' : 'loss',
    },
  ];

  if (values.calculationMode === 'price') {
    const stockPrice = num(values, 'stockPrice');
    const dte = num(values, 'dte');
    const rate = num(values, 'riskFreeRate');
    const longStrike = num(values, 'longStrike');
    const shortStrike = num(values, 'shortStrike');
    const longPrice = num(values, 'longOptionPrice');
    const shortPrice = num(values, 'shortOptionPrice');
    const isCall =
      calculatorId === 'bull-call-spread' || calculatorId === 'bear-call-spread';
    const longType = isCall ? 'call' : 'put';
    const shortType = isCall ? 'call' : 'put';
    const longLegLabel = isCall ? 'Long Call IV' : 'Long Put IV';
    const shortLegLabel = isCall ? 'Short Call IV' : 'Short Put IV';
    const longIv = impliedVolatility(longType, longPrice, stockPrice, longStrike, dte, rate);
    const shortIv = impliedVolatility(shortType, shortPrice, stockPrice, shortStrike, dte, rate);
    items.push(
      { label: shortLegLabel, value: `${shortIv.toFixed(1)}%` },
      { label: longLegLabel, value: `${longIv.toFixed(1)}%` },
    );
  } else {
    const isCall =
      calculatorId === 'bull-call-spread' || calculatorId === 'bear-call-spread';
    const iv = num(values, 'iv', 25);
    const longLegLabel = isCall ? 'Long Call IV' : 'Long Put IV';
    const shortLegLabel = isCall ? 'Short Call IV' : 'Short Put IV';
    items.push(
      { label: longLegLabel, value: `${iv.toFixed(1)}%` },
      { label: shortLegLabel, value: `${iv.toFixed(1)}%` },
    );
  }

  return [gridSection(undefined, items)];
}

function multiLegVolatilityMetrics(
  result: CalculatorResult,
  values: Record<string, string>,
  isCredit: boolean,
  calculatorId: string,
): MetricSection[] {
  const quantity = num(values, 'quantity', 1);
  const net = Math.abs(result.metrics.netPremium);
  const total = net * 100 * quantity;
  const maxReturn =
    typeof result.metrics.maxLoss === 'number' && result.metrics.maxLoss > 0
      ? ((result.metrics.maxProfit as number) / result.metrics.maxLoss) * 100
      : 0;
  const isIron = calculatorId === 'iron-condor' || calculatorId === 'iron-butterfly';

  const breakevenLabel =
    result.metrics.breakevens.length > 1 ? 'Lower B/E' : 'Breakeven';
  const upperBreakeven =
    result.metrics.breakevens.length > 1
      ? {
          label: 'Upper B/E',
          value: `$${result.metrics.breakevens[1].toFixed(2)}`,
        }
      : null;

  const creditItem: MetricItem = {
    label: isCredit ? 'Collect credit' : 'Pay debit',
    value: fmtMoney(total),
  };
  const ivItem: MetricItem = {
    label: 'Implied Volatility',
    value: `${num(values, 'iv', 25).toFixed(1)}%`,
  };
  const returnItem: MetricItem = {
    label: 'Return on Risk',
    value: fmtPct(maxReturn),
    variant: maxReturn >= 0 ? 'profit' : 'loss',
  };
  const coreItems: MetricItem[] = [
    {
      label: 'Max Profit',
      value: fmtMoney(result.metrics.maxProfit),
      variant: 'profit',
    },
    {
      label: 'Max Loss',
      value: fmtMoney(result.metrics.maxLoss),
      variant: 'loss',
    },
    {
      label: breakevenLabel,
      value: result.metrics.breakevens.length
        ? `$${result.metrics.breakevens[0].toFixed(2)}`
        : 'N/A',
    },
  ];
  if (upperBreakeven) coreItems.push(upperBreakeven);

  const items: MetricItem[] = isIron
    ? [creditItem, returnItem, ...coreItems, ivItem]
    : [ivItem, creditItem, ...coreItems];

  const sections: MetricSection[] = [gridSection(undefined, items)];

  if (result.greeks) {
    sections.push(
      gridSection('Greeks at Entry', [
        { label: 'Delta (Δ)', value: result.greeks.delta.toFixed(3) },
        { label: 'Gamma (Γ)', value: result.greeks.gamma.toFixed(4) },
        { label: 'Theta (Θ)', value: result.greeks.theta.toFixed(3) },
        { label: 'Vega (ν)', value: result.greeks.vega.toFixed(3) },
      ]),
    );
  }

  return sections;
}

export function buildCalculatorVisualization(
  calculatorId: string,
  result: CalculatorResult,
  values: Record<string, string>,
): CalculatorVisualization {
  const config = CALCULATOR_CONFIGS[calculatorId];
  const title = config?.title ?? 'Strategy';
  const quantity = num(values, 'quantity', 1);
  const stockPrice = num(values, 'stockPrice');
  const { metrics } = result;

  let chartSeries = buildChartSeries(result, { quantity });
  let chartMarkers: ChartMarker[] = [];
  let metricSections: MetricSection[] = [];

  switch (calculatorId) {
    case 'long-call':
      chartMarkers = buildMarkers(values, result, {
        strike: num(values, 'strike'),
        entryStockLabel: true,
      });
      metricSections = longLegMetrics(result, values, 'call');
      break;
    case 'long-put':
      chartMarkers = buildMarkers(values, result, {
        strike: num(values, 'strike'),
        entryStockLabel: true,
      });
      metricSections = longLegMetrics(result, values, 'put');
      break;
    case 'short-call':
    case 'short-put':
      chartMarkers = buildMarkers(values, result, {
        strike: num(values, 'strike'),
        entryStockLabel: true,
      });
      metricSections = shortLegMetrics(result, values, quantity);
      break;
    case 'bull-call-spread':
    case 'bear-put-spread':
      chartMarkers = buildMarkers(values, result, {
        longStrike: num(values, 'longStrike'),
        shortStrike: num(values, 'shortStrike'),
        breakevenShortLabel: true,
      });
      metricSections = spreadMetrics(result, values, false, calculatorId);
      break;
    case 'bull-put-spread':
    case 'bear-call-spread':
      chartMarkers = buildMarkers(values, result, {
        longStrike: num(values, 'longStrike'),
        shortStrike: num(values, 'shortStrike'),
        breakevenShortLabel: true,
      });
      metricSections = spreadMetrics(result, values, true, calculatorId);
      break;
    case 'covered-call': {
      const strike = num(values, 'strike');
      const premium = metrics.premium;
      const cashRequirement = (stockPrice - premium) * 100 * quantity;
      const credit = premium * 100 * quantity;
      const maxReturn =
        cashRequirement > 0 ? ((metrics.maxProfit as number) / cashRequirement) * 100 : 0;
      chartSeries = buildChartSeries(result, { quantity });
      chartMarkers = buildMarkers(values, result, {
        strike,
        strikeLabel: 'Call Strike',
        entryStockLabel: true,
      });
      metricSections = [
        gridSection(undefined, [
          { label: 'Cash Requirement', value: fmtMoney(cashRequirement) },
          { label: 'Credit Received', value: fmtMoney(credit), variant: 'profit' },
        ]),
        rowSection('Profit Scenarios', [
          {
            label: 'Shares Called Away (Max)',
            value: fmtMoney(metrics.maxProfit as number),
            secondary: fmtPct(maxReturn),
            variant: 'profit',
          },
          {
            label: 'Shares Flat (Premium Yield)',
            value: fmtMoney(credit),
            secondary: fmtPct((premium / stockPrice) * 100),
            variant: 'profit',
          },
        ]),
        gridSection(undefined, [
          {
            label: 'Break-Even',
            value: metrics.breakevens.length ? `$${metrics.breakevens[0].toFixed(2)}` : 'N/A',
          },
          {
            label: 'Max Loss',
            value: fmtMoney(metrics.maxLoss as number),
            secondary: '(stock to $0)',
            variant: 'loss',
          },
        ]),
      ];
      break;
    }
    case 'cash-secured-put': {
      const strike = num(values, 'strike');
      const premium = metrics.premium;
      const cashRequirement = strike * 100 * quantity;
      const credit = premium * 100 * quantity;
      const assignedBasis = strike - premium;
      chartSeries = buildChartSeries(result, { quantity });
      chartMarkers = buildMarkers(values, result, { strike, entryStockLabel: true });
      metricSections = [
        gridSection(undefined, [
          { label: 'Cash Requirement', value: fmtMoney(cashRequirement) },
          { label: 'Credit Received', value: fmtMoney(credit), variant: 'profit' },
        ]),
        rowSection('Scenarios', [
          {
            label: 'Expires OTM (Max Profit)',
            value: fmtMoney(metrics.maxProfit as number),
            variant: 'profit',
          },
          {
            label: 'Assigned (Share Cost Basis)',
            value: `$${assignedBasis.toFixed(2)}`,
          },
        ]),
        gridSection(undefined, [
          {
            label: 'Break-Even',
            value: metrics.breakevens.length ? `$${metrics.breakevens[0].toFixed(2)}` : 'N/A',
          },
          {
            label: 'Max Loss',
            value: fmtMoney(metrics.maxLoss as number),
            secondary: '(stock to $0)',
            variant: 'loss',
          },
        ]),
      ];
      break;
    }
    case 'pmcc': {
      const shortDte = num(values, 'shortDte');
      const netDebit = -metrics.netPremium;
      const cost = netDebit * 100 * quantity;
      const maxReturn = cost > 0 ? ((metrics.maxProfit as number) / cost) * 100 : 0;
      chartSeries = buildChartSeries(result, {
        quantity,
        expirationLabel: `T+${shortDte} (Short Exp)`,
      });
      chartMarkers = buildMarkers(values, result, { skipLegMarkers: true, skipBreakevenMarkers: true });
      const breakeven = metrics.breakevens[0];
      if (breakeven !== undefined) {
        chartMarkers.push({
          type: 'breakeven',
          value: breakeven,
          label: `B/E (Short Exp): $${breakeven.toFixed(2)}`,
          color: '#2df3b0',
        });
      }
      chartMarkers.push(
        {
          type: 'longStrike',
          value: num(values, 'longStrike'),
          label: `Long Call: $${num(values, 'longStrike')} (${num(values, 'longDte')} DTE)`,
          color: '#a78bfa',
        },
        {
          type: 'shortStrike',
          value: num(values, 'shortStrike'),
          label: `Short Call: $${num(values, 'shortStrike')} (${shortDte} DTE)`,
          color: '#ff6b6b',
        },
      );
      metricSections = [
        gridSection(undefined, [
          { label: 'Net Debit', value: fmtPremium(netDebit) },
          { label: 'Total Cost', value: fmtMoney(cost) },
        ]),
        gridSection('At Short Expiration', [
          {
            label: 'Max Profit (Est.)',
            value: fmtMoney(metrics.maxProfit as number),
            variant: 'profit',
          },
          {
            label: 'Max Loss',
            value: fmtMoney(metrics.maxLoss as number),
            variant: 'loss',
          },
          {
            label: 'Breakeven',
            value: metrics.breakevens.length ? `$${metrics.breakevens[0].toFixed(2)}` : 'N/A',
          },
          {
            label: 'Max Return',
            value: fmtPct(maxReturn),
            variant: 'profit',
          },
        ]),
        gridSection(undefined, [
          { label: 'Long Call IV', value: `${num(values, 'longIv', num(values, 'iv', 25)).toFixed(1)}%` },
          { label: 'Short Call IV', value: `${num(values, 'shortIv', num(values, 'iv', 25)).toFixed(1)}%` },
        ]),
      ];
      if (result.greeks) {
        metricSections.push(
          gridSection('Entry Greeks', [
            { label: 'Delta (Δ)', value: result.greeks.delta.toFixed(3) },
            { label: 'Gamma (Γ)', value: result.greeks.gamma.toFixed(4) },
            { label: 'Theta (Θ)', value: result.greeks.theta.toFixed(3) },
            { label: 'Vega (ν)', value: result.greeks.vega.toFixed(3) },
          ]),
        );
      }
      break;
    }
    case 'straddle':
    case 'strangle':
      chartMarkers = buildMarkers(values, result, { breakevenShortLabel: true });
      metricSections = multiLegVolatilityMetrics(
        result,
        values,
        values.positionType === 'short',
        calculatorId,
      );
      break;
    case 'iron-condor':
    case 'iron-butterfly':
      chartMarkers = buildMarkers(values, result, { breakevenShortLabel: true });
      metricSections = multiLegVolatilityMetrics(
        result,
        values,
        values.positionType === 'short',
        calculatorId,
      );
      break;
    case 'options-pricing':
    case 'implied-volatility':
      metricSections = [];
      chartSeries = [];
      chartMarkers = [];
      break;
    case 'expected-move':
      metricSections = [];
      chartSeries = [];
      chartMarkers = [];
      break;
    case 'theta-decay':
      metricSections = [];
      chartSeries = [];
      chartMarkers = [];
      break;
    default:
      chartMarkers = buildMarkers(values, result);
      metricSections = [
        gridSection(undefined, [
          {
            label: 'Max Profit',
            value: fmtMoney(metrics.maxProfit),
            variant: 'profit',
          },
          {
            label: 'Max Loss',
            value: fmtMoney(metrics.maxLoss),
            variant: 'loss',
          },
          { label: 'Premium', value: fmtPremium(metrics.premium) },
          {
            label: 'Breakeven',
            value: metrics.breakevens.length
              ? metrics.breakevens.map((b) => `$${b.toFixed(2)}`).join(' / ')
              : 'N/A',
          },
        ]),
      ];
      if (result.greeks) {
        metricSections.push(
          gridSection('Greeks', [
            { label: 'Delta (Δ)', value: result.greeks.delta.toFixed(3) },
            { label: 'Gamma (Γ)', value: result.greeks.gamma.toFixed(4) },
            { label: 'Theta (Θ)', value: result.greeks.theta.toFixed(3) },
            { label: 'Vega (ν)', value: result.greeks.vega.toFixed(3) },
          ]),
        );
      }
  }

  return {
    chartTitle: title,
    chartTitleShort: CHART_TITLE_SHORT[calculatorId] ?? title,
    chartSubtitle: buildChartSubtitle(calculatorId, values, result),
    chartSeries,
    chartMarkers,
    metricSections,
    chartNote:
      values.calculationMode === 'price' &&
      (calculatorId === 'iron-condor' || calculatorId === 'iron-butterfly')
        ? 'The T+0 line uses a single IV for all legs in price mode.'
        : undefined,
  };
}
