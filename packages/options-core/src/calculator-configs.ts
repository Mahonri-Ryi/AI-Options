import type { CalculatorResult } from './types.js';
import {
  bearCallSpread,
  bearPutSpread,
  bullCallSpread,
  bullPutSpread,
  cashSecuredPut,
  coveredCall,
  expectedMoveCone,
  expectedMoveDetail,
  impliedVolatility,
  ironButterfly,
  ironCondor,
  longCall,
  longPut,
  optionsPricing,
  poorMansCoveredCall,
  shortCall,
  shortPut,
  straddle,
  strangle,
  thetaDecayAnalysis,
} from './strategies/index.js';
import { getDefaultFormValues } from './calculator-ui.js';

export interface CalculatorField {
  key: string;
  label: string;
  defaultValue: string;
  suffix?: string;
}

export interface CalculatorConfig {
  id: string;
  title: string;
  fields: CalculatorField[];
  compute: (values: Record<string, string>) => CalculatorResult | null;
}

function num(values: Record<string, string>, key: string, fallback = 0): number {
  const parsed = Number(values[key]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function baseInputs(values: Record<string, string>) {
  const calculationMode = values.calculationMode === 'price' ? 'price' : 'iv';
  return {
    stockPrice: num(values, 'stockPrice', 100),
    dte: num(values, 'dte', 30),
    riskFreeRate: num(values, 'riskFreeRate', 5),
    dividendYield: num(values, 'dividendYield', 0),
    quantity: num(values, 'quantity', 1),
    calculationMode: calculationMode as 'iv' | 'price',
    iv: num(values, 'iv', 25),
    optionPrice: values.optionPrice ? num(values, 'optionPrice') : undefined,
  };
}

function spreadPriceInputs(values: Record<string, string>) {
  const mode = values.calculationMode === 'price' ? 'price' : 'iv';
  if (mode !== 'price') return {};
  return {
    calculationMode: 'price' as const,
    longOptionPrice: num(values, 'longOptionPrice'),
    shortOptionPrice: num(values, 'shortOptionPrice'),
  };
}
export const CALCULATOR_CONFIGS: Record<string, CalculatorConfig> = {
  'long-call': {
    id: 'long-call',
    title: 'Long Call',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'strike', label: 'Strike', defaultValue: '105' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '30' },
      { key: 'iv', label: 'IV', defaultValue: '25', suffix: '%' },
      { key: 'riskFreeRate', label: 'Rate', defaultValue: '5', suffix: '%' },
      { key: 'dividendYield', label: 'Div Yield', defaultValue: '0', suffix: '%' },
      { key: 'quantity', label: 'Contracts', defaultValue: '1' },
    ],
    compute: (values) =>
      longCall({
        ...baseInputs(values),
        strike: num(values, 'strike'),
        type: 'call',
        side: 'long',
      }),
  },
  'long-put': {
    id: 'long-put',
    title: 'Long Put',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'strike', label: 'Strike', defaultValue: '95' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '60' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: '%' },
      { key: 'riskFreeRate', label: 'Rate', defaultValue: '5', suffix: '%' },
      { key: 'dividendYield', label: 'Div Yield', defaultValue: '0', suffix: '%' },
      { key: 'quantity', label: 'Contracts', defaultValue: '1' },
    ],
    compute: (values) =>
      longPut({ ...baseInputs(values), strike: num(values, 'strike'), type: 'put', side: 'long' }),
  },
  'short-call': {
    id: 'short-call',
    title: 'Short Call',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'strike', label: 'Strike', defaultValue: '105' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '60' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: '%' },
      { key: 'riskFreeRate', label: 'Rate', defaultValue: '5', suffix: '%' },
      { key: 'dividendYield', label: 'Div Yield', defaultValue: '0', suffix: '%' },
      { key: 'quantity', label: 'Contracts', defaultValue: '1' },
    ],
    compute: (values) =>
      shortCall({ ...baseInputs(values), strike: num(values, 'strike'), type: 'call', side: 'short' }),
  },
  'short-put': {
    id: 'short-put',
    title: 'Short Put',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'strike', label: 'Strike', defaultValue: '95' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '60' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: '%' },
      { key: 'riskFreeRate', label: 'Rate', defaultValue: '5', suffix: '%' },
      { key: 'dividendYield', label: 'Div Yield', defaultValue: '0', suffix: '%' },
      { key: 'quantity', label: 'Contracts', defaultValue: '1' },
    ],
    compute: (values) =>
      shortPut({ ...baseInputs(values), strike: num(values, 'strike'), type: 'put', side: 'short' }),
  },
  'bull-call-spread': {
    id: 'bull-call-spread',
    title: 'Bull Call Spread',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'longStrike', label: 'Long Strike', defaultValue: '100' },
      { key: 'shortStrike', label: 'Short Strike', defaultValue: '110' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '30' },
      { key: 'iv', label: 'IV', defaultValue: '25', suffix: '%' },
      { key: 'quantity', label: 'Contracts', defaultValue: '1' },
    ],
    compute: (values) =>
      bullCallSpread({
        ...baseInputs(values),
        ...spreadPriceInputs(values),
        longStrike: num(values, 'longStrike'),
        shortStrike: num(values, 'shortStrike'),
        longType: 'call',
      }),
  },
  'bull-put-spread': {
    id: 'bull-put-spread',
    title: 'Bull Put Spread',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'longStrike', label: 'Long Strike', defaultValue: '90' },
      { key: 'shortStrike', label: 'Short Strike', defaultValue: '100' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '30' },
      { key: 'iv', label: 'IV', defaultValue: '25', suffix: '%' },
      { key: 'quantity', label: 'Contracts', defaultValue: '1' },
    ],
    compute: (values) =>
      bullPutSpread({
        ...baseInputs(values),
        ...spreadPriceInputs(values),
        longStrike: num(values, 'longStrike'),
        shortStrike: num(values, 'shortStrike'),
        longType: 'put',
      }),
  },
  'bear-put-spread': {
    id: 'bear-put-spread',
    title: 'Bear Put Spread',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'longStrike', label: 'Long Strike', defaultValue: '100' },
      { key: 'shortStrike', label: 'Short Strike', defaultValue: '90' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '30' },
      { key: 'iv', label: 'IV', defaultValue: '25', suffix: '%' },
      { key: 'quantity', label: 'Contracts', defaultValue: '1' },
    ],
    compute: (values) =>
      bearPutSpread({
        ...baseInputs(values),
        ...spreadPriceInputs(values),
        longStrike: num(values, 'longStrike'),
        shortStrike: num(values, 'shortStrike'),
        longType: 'put',
      }),
  },
  'bear-call-spread': {
    id: 'bear-call-spread',
    title: 'Bear Call Spread',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'shortStrike', label: 'Short Strike', defaultValue: '105' },
      { key: 'longStrike', label: 'Long Strike', defaultValue: '110' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '30' },
      { key: 'iv', label: 'IV', defaultValue: '25', suffix: '%' },
      { key: 'riskFreeRate', label: 'Rate', defaultValue: '5', suffix: '%' },
      { key: 'dividendYield', label: 'Div Yield', defaultValue: '0', suffix: '%' },
      { key: 'quantity', label: 'Contracts', defaultValue: '1' },
    ],
    compute: (values) =>
      bearCallSpread({
        ...baseInputs(values),
        ...spreadPriceInputs(values),
        longStrike: num(values, 'longStrike'),
        shortStrike: num(values, 'shortStrike'),
        longType: 'call',
      }),
  },
  'covered-call': {
    id: 'covered-call',
    title: 'Covered Call',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'strike', label: 'Call Strike', defaultValue: '105' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '60' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: '%' },
      { key: 'riskFreeRate', label: 'Rate', defaultValue: '5', suffix: '%' },
      { key: 'dividendYield', label: 'Div Yield', defaultValue: '0', suffix: '%' },
      { key: 'quantity', label: 'Contracts', defaultValue: '1' },
    ],
    compute: (values) => {
      const inputs = baseInputs(values);
      return coveredCall({
        ...inputs,
        strike: num(values, 'strike'),
        shareCostBasis: num(values, 'stockPrice'),
        callPremium: inputs.calculationMode === 'price' ? inputs.optionPrice : undefined,
      });
    },
  },
  'cash-secured-put': {
    id: 'cash-secured-put',
    title: 'Cash-Secured Put',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'strike', label: 'Strike', defaultValue: '95' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '30' },
      { key: 'iv', label: 'IV', defaultValue: '25', suffix: '%' },
      { key: 'quantity', label: 'Contracts', defaultValue: '1' },
    ],
    compute: (values) =>
      cashSecuredPut({ ...baseInputs(values), strike: num(values, 'strike'), type: 'put', side: 'short' }),
  },
  pmcc: {
    id: 'pmcc',
    title: "Poor Man's Covered Call",
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '185' },
      { key: 'longStrike', label: 'Long Call Strike', defaultValue: '180' },
      { key: 'shortStrike', label: 'Short Call Strike', defaultValue: '220' },
      { key: 'longDte', label: 'Long DTE', defaultValue: '365' },
      { key: 'shortDte', label: 'Short DTE', defaultValue: '60' },
      { key: 'iv', label: 'IV', defaultValue: '25', suffix: '%' },
      { key: 'riskFreeRate', label: 'Rate', defaultValue: '4', suffix: '%' },
      { key: 'dividendYield', label: 'Div Yield', defaultValue: '0', suffix: '%' },
      { key: 'quantity', label: 'Contracts', defaultValue: '1' },
    ],
    compute: (values) =>
      poorMansCoveredCall({
        ...baseInputs(values),
        longStrike: num(values, 'longStrike'),
        shortStrike: num(values, 'shortStrike'),
        longDte: num(values, 'longDte'),
        shortDte: num(values, 'shortDte'),
      }),
  },
  straddle: {
    id: 'straddle',
    title: 'Straddle',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'strike', label: 'Strike', defaultValue: '100' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '30' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: '%' },
      { key: 'riskFreeRate', label: 'Rate', defaultValue: '4.5', suffix: '%' },
      { key: 'dividendYield', label: 'Div Yield', defaultValue: '0', suffix: '%' },
      { key: 'positionType', label: 'Position (long/short)', defaultValue: 'long' },
      { key: 'quantity', label: 'Contracts', defaultValue: '1' },
    ],
    compute: (values) =>
      straddle({
        ...baseInputs(values),
        strike: num(values, 'strike'),
        positionType: values.positionType === 'short' ? 'short' : 'long',
      }),
  },
  strangle: {
    id: 'strangle',
    title: 'Strangle',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'putStrike', label: 'Put Strike', defaultValue: '95' },
      { key: 'callStrike', label: 'Call Strike', defaultValue: '105' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '30' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: '%' },
      { key: 'riskFreeRate', label: 'Rate', defaultValue: '4.5', suffix: '%' },
      { key: 'dividendYield', label: 'Div Yield', defaultValue: '0', suffix: '%' },
      { key: 'positionType', label: 'Position (long/short)', defaultValue: 'long' },
      { key: 'quantity', label: 'Contracts', defaultValue: '1' },
    ],
    compute: (values) =>
      strangle({
        ...baseInputs(values),
        putStrike: num(values, 'putStrike'),
        callStrike: num(values, 'callStrike'),
        positionType: values.positionType === 'short' ? 'short' : 'long',
      }),
  },
  'iron-condor': {
    id: 'iron-condor',
    title: 'Iron Condor',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '200' },
      { key: 'longPutStrike', label: 'Long Put', defaultValue: '170' },
      { key: 'shortPutStrike', label: 'Short Put', defaultValue: '180' },
      { key: 'shortCallStrike', label: 'Short Call', defaultValue: '220' },
      { key: 'longCallStrike', label: 'Long Call', defaultValue: '230' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '60' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: '%' },
      { key: 'quantity', label: 'Contracts', defaultValue: '1' },
    ],
    compute: (values) =>
      ironCondor({
        ...baseInputs(values),
        longPutStrike: num(values, 'longPutStrike'),
        shortPutStrike: num(values, 'shortPutStrike'),
        shortCallStrike: num(values, 'shortCallStrike'),
        longCallStrike: num(values, 'longCallStrike'),
        positionType: 'short',
      }),
  },
  'iron-butterfly': {
    id: 'iron-butterfly',
    title: 'Iron Butterfly',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '200' },
      { key: 'longPutStrike', label: 'Long Put', defaultValue: '190' },
      { key: 'shortPutStrike', label: 'Body Strike', defaultValue: '200' },
      { key: 'shortCallStrike', label: 'Body Strike (Call)', defaultValue: '200' },
      { key: 'longCallStrike', label: 'Long Call', defaultValue: '210' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '45' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: '%' },
      { key: 'quantity', label: 'Contracts', defaultValue: '1' },
    ],
    compute: (values) =>
      ironButterfly({
        ...baseInputs(values),
        longPutStrike: num(values, 'longPutStrike'),
        shortPutStrike: num(values, 'shortPutStrike'),
        shortCallStrike: num(values, 'shortCallStrike', num(values, 'shortPutStrike')),
        longCallStrike: num(values, 'longCallStrike'),
        positionType: 'short',
      }),
  },
  'options-pricing': {
    id: 'options-pricing',
    title: 'Options Pricing',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'strike', label: 'Strike', defaultValue: '100' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '30' },
      { key: 'iv', label: 'IV', defaultValue: '25', suffix: '%' },
      { key: 'riskFreeRate', label: 'Rate', defaultValue: '5', suffix: '%' },
      { key: 'optionType', label: 'Type (call/put)', defaultValue: 'call' },
    ],
    compute: (values) => {
      const pricing = optionsPricing({
        stockPrice: num(values, 'stockPrice'),
        strike: num(values, 'strike'),
        dte: num(values, 'dte'),
        iv: num(values, 'iv'),
        riskFreeRate: num(values, 'riskFreeRate'),
        dividendYield: 0,
        type: values.optionType === 'put' ? 'put' : 'call',
      });
      return {
        metrics: {
          maxProfit: 0,
          maxLoss: 0,
          breakevens: [],
          netPremium: pricing.price,
          premium: pricing.price,
          greeks: pricing.greeks,
        },
        curve: [],
        greeks: pricing.greeks,
      };
    },
  },
  'implied-volatility': {
    id: 'implied-volatility',
    title: 'Implied Volatility',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'strike', label: 'Strike', defaultValue: '100' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '30' },
      { key: 'optionPrice', label: 'Option Price', defaultValue: '5.50' },
      { key: 'riskFreeRate', label: 'Rate', defaultValue: '4.5', suffix: '%' },
      { key: 'dividendYield', label: 'Div Yield', defaultValue: '0', suffix: '%' },
      { key: 'optionType', label: 'Type (call/put)', defaultValue: 'call' },
    ],
    compute: (values) => {
      const iv = impliedVolatility(
        values.optionType === 'put' ? 'put' : 'call',
        num(values, 'optionPrice'),
        num(values, 'stockPrice'),
        num(values, 'strike'),
        num(values, 'dte'),
        num(values, 'riskFreeRate'),
      );
      return {
        metrics: {
          maxProfit: 0,
          maxLoss: 0,
          breakevens: [],
          netPremium: iv,
          premium: iv,
        },
        curve: [],
      };
    },
  },
  'theta-decay': {
    id: 'theta-decay',
    title: 'Theta Decay Curve',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'strike', label: 'Strike', defaultValue: '100' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '45' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: '%' },
      { key: 'riskFreeRate', label: 'Rate', defaultValue: '4.5', suffix: '%' },
      { key: 'dividendYield', label: 'Div Yield', defaultValue: '0', suffix: '%' },
      { key: 'optionType', label: 'Type (call/put)', defaultValue: 'call' },
    ],
    compute: (values) => {
      const type = values.optionType === 'put' ? 'put' : 'call';
      const stockPrice = num(values, 'stockPrice');
      const strike = num(values, 'strike');
      const dte = num(values, 'dte');
      const iv = num(values, 'iv');
      const riskFreeRate = num(values, 'riskFreeRate');
      const dividendYield = num(values, 'dividendYield', 0);
      const { detail, chart } = thetaDecayAnalysis(
        type,
        stockPrice,
        strike,
        dte,
        iv,
        riskFreeRate,
        dividendYield,
      );
      return {
        metrics: {
          maxProfit: detail.entryPrice,
          maxLoss: detail.expirationValue,
          breakevens: [],
          netPremium: detail.entryPrice,
          premium: detail.expirationValue,
        },
        curve: chart.decayCurve.map((point) => ({
          stockPrice: point.dte,
          pnl: point.optionPrice,
        })),
        thetaDecayDetail: detail,
        thetaDecayChart: chart,
      };
    },
  },
  'expected-move': {
    id: 'expected-move',
    title: 'Expected Move',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: '%' },
      { key: 'dte', label: 'Days', defaultValue: '30' },
    ],
    compute: (values) => {
      const stockPrice = num(values, 'stockPrice');
      const iv = num(values, 'iv');
      const dte = num(values, 'dte');
      const detail = expectedMoveDetail(stockPrice, iv, dte);
      const cone = expectedMoveCone(stockPrice, iv, dte);
      return {
        metrics: {
          maxProfit: detail.upperBound,
          maxLoss: detail.lowerBound,
          breakevens: [detail.upperBound, detail.lowerBound],
          netPremium: detail.expectedMove,
          premium: detail.movePercent,
        },
        curve: [],
        expectedMoveDetail: detail,
        expectedMoveCone: cone,
      };
    },
  },
};

export function getDefaultValues(configId: string): Record<string, string> {
  const config = CALCULATOR_CONFIGS[configId];
  if (!config) return {};
  return {
    ...Object.fromEntries(config.fields.map((field) => [field.key, field.defaultValue])),
    ...getDefaultFormValues(configId),
  };
}

export function computeCalculator(
  configId: string,
  values: Record<string, string>,
): CalculatorResult | null {
  const config = CALCULATOR_CONFIGS[configId];
  if (!config) return null;
  return config.compute(values);
}
