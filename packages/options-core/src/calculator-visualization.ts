import type {
  CalculatorResult,
  CalculatorVisualization,
  ChartMarker,
  ChartSeries,
  MetricItem,
  MetricSection,
} from './types.js';
import { CALCULATOR_CONFIGS } from './calculator-configs.js';

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

function buildMarkers(
  values: Record<string, string>,
  result: CalculatorResult,
  options: {
    strike?: number;
    longStrike?: number;
    shortStrike?: number;
  } = {},
): ChartMarker[] {
  const markers: ChartMarker[] = [];
  const stockPrice = num(values, 'stockPrice');
  if (stockPrice > 0) {
    markers.push({
      type: 'current',
      value: stockPrice,
      label: `Entry Stock: $${stockPrice.toFixed(2)}`,
    });
  }
  if (options.strike !== undefined) {
    markers.push({
      type: 'strike',
      value: options.strike,
      label: `Strike: $${options.strike.toFixed(2)}`,
    });
  }
  if (options.longStrike !== undefined) {
    markers.push({
      type: 'longStrike',
      value: options.longStrike,
      label: `Long Strike: $${options.longStrike.toFixed(2)}`,
    });
  }
  if (options.shortStrike !== undefined) {
    markers.push({
      type: 'shortStrike',
      value: options.shortStrike,
      label: `Short Strike: $${options.shortStrike.toFixed(2)}`,
    });
  }
  for (const breakeven of result.metrics.breakevens) {
    markers.push({
      type: 'breakeven',
      value: breakeven,
      label: `Breakeven: $${breakeven.toFixed(2)}`,
    });
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

  const sections: MetricSection[] = [
    gridSection(undefined, [
      { label: 'Total Cost', value: fmtMoney(totalCost) },
      { label: 'Intrinsic Value', value: fmtPremium(intrinsic) },
      { label: 'Extrinsic Value', value: fmtPremium(extrinsic) },
      {
        label: 'Breakeven',
        value: result.metrics.breakevens.length
          ? `$${result.metrics.breakevens[0].toFixed(2)}`
          : 'N/A',
      },
      {
        label: 'Max Loss',
        value: fmtMoney(result.metrics.maxLoss as number),
        secondary: `(${maxLossPct.toFixed(0)}%)`,
        variant: 'loss',
      },
    ]),
  ];

  if (result.greeks) {
    sections.push(
      gridSection('Greeks at Entry', [
        { label: 'Delta (Δ)', value: result.greeks.delta.toFixed(3) },
        { label: 'Theta (Θ)', value: result.greeks.theta.toFixed(3) },
        { label: 'Implied Vol', value: `${num(values, 'iv', 25).toFixed(1)}%` },
      ]),
    );
  }

  return sections;
}

function shortLegMetrics(result: CalculatorResult, quantity: number): MetricSection[] {
  const sections: MetricSection[] = [
    gridSection(undefined, [
      { label: 'Credit Received', value: fmtMoney(result.metrics.premium * 100 * quantity) },
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
): MetricSection[] {
  const quantity = num(values, 'quantity', 1);
  const net = Math.abs(result.metrics.netPremium);
  const total = net * 100 * quantity;
  const maxReturn =
    typeof result.metrics.maxLoss === 'number' && result.metrics.maxLoss > 0
      ? ((result.metrics.maxProfit as number) / result.metrics.maxLoss) * 100
      : 0;

  return [
    gridSection(undefined, [
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
    ]),
  ];
}

function multiLegVolatilityMetrics(
  result: CalculatorResult,
  values: Record<string, string>,
  isCredit: boolean,
): MetricSection[] {
  const quantity = num(values, 'quantity', 1);
  const net = Math.abs(result.metrics.netPremium);
  const total = net * 100 * quantity;
  const maxReturn =
    typeof result.metrics.maxLoss === 'number' && result.metrics.maxLoss > 0
      ? ((result.metrics.maxProfit as number) / result.metrics.maxLoss) * 100
      : 0;

  const breakevenLabel =
    result.metrics.breakevens.length > 1 ? 'Lower B/E' : 'Breakeven';
  const upperBreakeven =
    result.metrics.breakevens.length > 1
      ? {
          label: 'Upper B/E',
          value: `$${result.metrics.breakevens[1].toFixed(2)}`,
        }
      : null;

  const items: MetricItem[] = [
    {
      label: isCredit ? 'Collect credit' : 'Pay debit',
      value: fmtMoney(total),
    },
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
      label: breakevenLabel,
      value: result.metrics.breakevens.length
        ? `$${result.metrics.breakevens[0].toFixed(2)}`
        : 'N/A',
    },
  ];
  if (upperBreakeven) items.push(upperBreakeven);
  items.push({
    label: 'Return on Risk',
    value: fmtPct(maxReturn),
    variant: maxReturn >= 0 ? 'profit' : 'loss',
  });

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
      chartMarkers = buildMarkers(values, result, { strike: num(values, 'strike') });
      metricSections = longLegMetrics(result, values, 'call');
      break;
    case 'long-put':
      chartMarkers = buildMarkers(values, result, { strike: num(values, 'strike') });
      metricSections = longLegMetrics(result, values, 'put');
      break;
    case 'short-call':
    case 'short-put':
      chartMarkers = buildMarkers(values, result, { strike: num(values, 'strike') });
      metricSections = shortLegMetrics(result, quantity);
      break;
    case 'bull-call-spread':
    case 'bear-put-spread':
      chartMarkers = buildMarkers(values, result, {
        longStrike: num(values, 'longStrike'),
        shortStrike: num(values, 'shortStrike'),
      });
      metricSections = spreadMetrics(result, values, false);
      break;
    case 'bull-put-spread':
    case 'bear-call-spread':
      chartMarkers = buildMarkers(values, result, {
        longStrike: num(values, 'longStrike'),
        shortStrike: num(values, 'shortStrike'),
      });
      metricSections = spreadMetrics(result, values, true);
      break;
    case 'covered-call': {
      const strike = num(values, 'strike');
      const premium = metrics.premium;
      const cashRequirement = (stockPrice - premium) * 100 * quantity;
      const credit = premium * 100 * quantity;
      const maxReturn =
        cashRequirement > 0 ? ((metrics.maxProfit as number) / cashRequirement) * 100 : 0;
      chartSeries = buildChartSeries(result, { quantity });
      chartMarkers = buildMarkers(values, result, { strike });
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
      chartMarkers = buildMarkers(values, result, { strike });
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
      chartMarkers = buildMarkers(values, result, {
        longStrike: num(values, 'longStrike'),
        shortStrike: num(values, 'shortStrike'),
      });
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
      chartMarkers = buildMarkers(values, result);
      metricSections = multiLegVolatilityMetrics(
        result,
        values,
        values.positionType === 'short',
      );
      break;
    case 'iron-condor':
    case 'iron-butterfly':
      chartMarkers = buildMarkers(values, result);
      metricSections = multiLegVolatilityMetrics(
        result,
        values,
        values.positionType === 'short',
      );
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
    chartSeries,
    chartMarkers,
    metricSections,
  };
}
