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
import { getDefaultFormValues } from './calculator-form-config.js';
import { buildCalculatorVisualization } from './calculator-visualization.js';

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

function volPriceInputs(values: Record<string, string>) {
  const mode = values.calculationMode === 'price' ? 'price' : 'iv';
  if (mode !== 'price') return {};
  const isLong = values.positionType === 'long';
  return {
    calculationMode: 'price' as const,
    netPremiumInput: isLong
      ? num(values, 'optionPrice', num(values, 'netPremiumInput'))
      : num(values, 'netPremiumInput'),
    netCreditInput: values.netCreditInput ? num(values, 'netCreditInput') : undefined,
  };
}

const QTY = { key: 'quantity', label: 'Quantity', defaultValue: '1' };
const RATE = { key: 'riskFreeRate', label: 'Rate', defaultValue: '5', suffix: ' (%)' };
const DIV = { key: 'dividendYield', label: 'Div Yield', defaultValue: '0', suffix: ' (%)' };
const OPTION_PRICE = { key: 'optionPrice', label: 'Option Price', defaultValue: '2.50' };
export const CALCULATOR_CONFIGS: Record<string, CalculatorConfig> = {
  'long-call': {
    id: 'long-call',
    title: 'Long Call',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'strike', label: 'Strike Price', defaultValue: '105' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '30' },
      { key: 'iv', label: 'IV', defaultValue: '25', suffix: ' (%)' },
      OPTION_PRICE,
      RATE,
      DIV,
      QTY,
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
      { key: 'strike', label: 'Strike Price', defaultValue: '95' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '60' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: ' (%)' },
      OPTION_PRICE,
      RATE,
      DIV,
      QTY,
    ],
    compute: (values) =>
      longPut({ ...baseInputs(values), strike: num(values, 'strike'), type: 'put', side: 'long' }),
  },
  'short-call': {
    id: 'short-call',
    title: 'Short Call',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'strike', label: 'Strike Price', defaultValue: '105' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '60' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: ' (%)' },
      OPTION_PRICE,
      RATE,
      DIV,
      QTY,
    ],
    compute: (values) =>
      shortCall({ ...baseInputs(values), strike: num(values, 'strike'), type: 'call', side: 'short' }),
  },
  'short-put': {
    id: 'short-put',
    title: 'Short Put',
    fields: [
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'strike', label: 'Strike Price', defaultValue: '95' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '60' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: ' (%)' },
      OPTION_PRICE,
      RATE,
      DIV,
      QTY,
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
      { key: 'iv', label: 'IV', defaultValue: '25', suffix: ' (%)' },
      { key: 'longOptionPrice', label: 'LC Price', defaultValue: '3.50' },
      { key: 'shortOptionPrice', label: 'SC Price', defaultValue: '1.00' },
      RATE,
      DIV,
      QTY,
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
      { key: 'shortStrike', label: 'Short Strike', defaultValue: '100' },
      { key: 'longStrike', label: 'Long Strike', defaultValue: '90' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '30' },
      { key: 'iv', label: 'IV', defaultValue: '25', suffix: ' (%)' },
      { key: 'longOptionPrice', label: 'LP Price', defaultValue: '1.00' },
      { key: 'shortOptionPrice', label: 'SP Price', defaultValue: '3.50' },
      RATE,
      DIV,
      QTY,
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
      { key: 'iv', label: 'IV', defaultValue: '25', suffix: ' (%)' },
      { key: 'longOptionPrice', label: 'LP Price', defaultValue: '3.50' },
      { key: 'shortOptionPrice', label: 'SP Price', defaultValue: '1.00' },
      RATE,
      DIV,
      QTY,
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
      { key: 'iv', label: 'IV', defaultValue: '25', suffix: ' (%)' },
      { key: 'shortOptionPrice', label: 'SC Price', defaultValue: '2.00' },
      { key: 'longOptionPrice', label: 'LC Price', defaultValue: '0.75' },
      RATE,
      DIV,
      QTY,
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
      { key: 'strike', label: 'Strike Price', defaultValue: '105' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '60' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: ' (%)' },
      OPTION_PRICE,
      RATE,
      DIV,
      QTY,
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
      { key: 'strike', label: 'Strike Price', defaultValue: '95' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '60' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: ' (%)' },
      OPTION_PRICE,
      RATE,
      DIV,
      QTY,
    ],
    compute: (values) =>
      cashSecuredPut({ ...baseInputs(values), strike: num(values, 'strike'), type: 'put', side: 'short' }),
  },
  pmcc: {
    id: 'pmcc',
    title: "Poor Man's Covered Call",
    fields: [
      { key: 'longStrike', label: 'Long Strike', defaultValue: '180' },
      { key: 'shortStrike', label: 'Short Strike', defaultValue: '220' },
      { key: 'longDte', label: 'LC DTE', defaultValue: '365' },
      { key: 'shortDte', label: 'SC DTE', defaultValue: '60' },
      { key: 'longIv', label: 'Long IV', defaultValue: '45', suffix: ' (%)' },
      { key: 'shortIv', label: 'Short IV', defaultValue: '47', suffix: ' (%)' },
      { key: 'longOptionPrice', label: 'LC Price', defaultValue: '40' },
      { key: 'shortOptionPrice', label: 'SC Price', defaultValue: '4' },
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '185' },
      { key: 'riskFreeRate', label: 'Rate', defaultValue: '4', suffix: ' (%)' },
      { key: 'dividendYield', label: 'Div Yield', defaultValue: '0', suffix: ' (%)' },
      QTY,
    ],
    compute: (values) => {
      const mode = values.calculationMode === 'iv' ? 'iv' : 'price';
      return poorMansCoveredCall({
        ...baseInputs(values),
        calculationMode: mode,
        longStrike: num(values, 'longStrike'),
        shortStrike: num(values, 'shortStrike'),
        longDte: num(values, 'longDte'),
        shortDte: num(values, 'shortDte'),
        longIv: num(values, 'longIv', num(values, 'iv', 25)),
        shortIv: num(values, 'shortIv', num(values, 'iv', 25)),
        longPremium: values.longOptionPrice ? num(values, 'longOptionPrice') : undefined,
        shortPremium: values.shortOptionPrice ? num(values, 'shortOptionPrice') : undefined,
      });
    },
  },
  straddle: {
    id: 'straddle',
    title: 'Straddle',
    fields: [
      { key: 'strike', label: 'Strike', defaultValue: '100' },
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '30' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: ' (%)' },
      RATE,
      DIV,
      { key: 'optionPrice', label: 'Net Debit', defaultValue: '5' },
      { key: 'netPremiumInput', label: 'Net Credit', defaultValue: '5' },
      { key: 'positionType', label: 'Position', defaultValue: 'short' },
      QTY,
    ],
    compute: (values) =>
      straddle({
        ...baseInputs(values),
        ...volPriceInputs(values),
        strike: num(values, 'strike'),
        positionType: values.positionType === 'long' ? 'long' : 'short',
        netPremiumInput: values.netPremiumInput ? num(values, 'netPremiumInput') : undefined,
      }),
  },
  strangle: {
    id: 'strangle',
    title: 'Strangle',
    fields: [
      { key: 'putStrike', label: 'Put Strike', defaultValue: '95' },
      { key: 'callStrike', label: 'Call Strike', defaultValue: '105' },
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '100' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '30' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: ' (%)' },
      RATE,
      DIV,
      { key: 'optionPrice', label: 'Net Debit', defaultValue: '3' },
      { key: 'netPremiumInput', label: 'Net Credit', defaultValue: '3' },
      { key: 'positionType', label: 'Position', defaultValue: 'short' },
      QTY,
    ],
    compute: (values) =>
      strangle({
        ...baseInputs(values),
        ...volPriceInputs(values),
        putStrike: num(values, 'putStrike'),
        callStrike: num(values, 'callStrike'),
        positionType: values.positionType === 'long' ? 'long' : 'short',
        netPremiumInput: values.netPremiumInput ? num(values, 'netPremiumInput') : undefined,
      }),
  },
  'iron-condor': {
    id: 'iron-condor',
    title: 'Iron Condor',
    fields: [
      { key: 'longPutStrike', label: 'Long Put', defaultValue: '170' },
      { key: 'shortPutStrike', label: 'Short Put', defaultValue: '180' },
      { key: 'shortCallStrike', label: 'Short Call', defaultValue: '220' },
      { key: 'longCallStrike', label: 'Long Call', defaultValue: '230' },
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '200' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '60' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: ' (%)' },
      RATE,
      DIV,
      { key: 'netCreditInput', label: 'Net Credit', defaultValue: '5' },
      { key: 'positionType', label: 'Position', defaultValue: 'short' },
      QTY,
    ],
    compute: (values) =>
      ironCondor({
        ...baseInputs(values),
        ...volPriceInputs(values),
        longPutStrike: num(values, 'longPutStrike'),
        shortPutStrike: num(values, 'shortPutStrike'),
        shortCallStrike: num(values, 'shortCallStrike'),
        longCallStrike: num(values, 'longCallStrike'),
        positionType: values.positionType === 'long' ? 'long' : 'short',
        netCreditInput: values.netCreditInput ? num(values, 'netCreditInput') : undefined,
      }),
  },
  'iron-butterfly': {
    id: 'iron-butterfly',
    title: 'Iron Butterfly',
    fields: [
      { key: 'longPutStrike', label: 'Long Put', defaultValue: '180' },
      { key: 'bodyStrike', label: 'Short Strike', defaultValue: '200' },
      { key: 'longCallStrike', label: 'Long Call', defaultValue: '220' },
      { key: 'stockPrice', label: 'Stock Price', defaultValue: '200' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '60' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: ' (%)' },
      RATE,
      DIV,
      { key: 'netCreditInput', label: 'Net Credit', defaultValue: '8' },
      { key: 'positionType', label: 'Position', defaultValue: 'short' },
      QTY,
    ],
    compute: (values) => {
      const body = num(values, 'bodyStrike');
      return ironButterfly({
        ...baseInputs(values),
        ...volPriceInputs(values),
        longPutStrike: num(values, 'longPutStrike'),
        shortPutStrike: body,
        shortCallStrike: body,
        longCallStrike: num(values, 'longCallStrike'),
        positionType: values.positionType === 'long' ? 'long' : 'short',
        netCreditInput: values.netCreditInput ? num(values, 'netCreditInput') : undefined,
      });
    },
  },
  'options-pricing': {
    id: 'options-pricing',
    title: 'Options Pricing',
    fields: [
      { key: 'stockPrice', label: 'Stock Price ($)', defaultValue: '100' },
      { key: 'strike', label: 'Strike Price ($)', defaultValue: '100' },
      { key: 'dte', label: 'Days to Expiration', defaultValue: '30' },
      { key: 'iv', label: 'Implied Volatility (%)', defaultValue: '25' },
      { key: 'riskFreeRate', label: 'Risk-Free Rate (%)', defaultValue: '5' },
      { key: 'dividendYield', label: 'Dividend Yield (%)', defaultValue: '0' },
      { key: 'pricingModel', label: 'Model', defaultValue: 'bs' },
      { key: 'binomialSteps', label: 'Binomial Tree Steps', defaultValue: '50' },
    ],
    compute: (values) => {
      const inputs = {
        stockPrice: num(values, 'stockPrice'),
        strike: num(values, 'strike'),
        dte: num(values, 'dte'),
        iv: num(values, 'iv'),
        riskFreeRate: num(values, 'riskFreeRate'),
        dividendYield: num(values, 'dividendYield', 0),
      };
      const call = optionsPricing({ ...inputs, type: 'call' });
      const put = optionsPricing({ ...inputs, type: 'put' });
      return {
        metrics: {
          maxProfit: 0,
          maxLoss: 0,
          breakevens: [],
          netPremium: call.price,
          premium: put.price,
        },
        curve: [],
        greeks: call.greeks,
        pricingResult: {
          callPrice: call.price,
          putPrice: put.price,
          callGreeks: call.greeks,
          putGreeks: put.greeks,
          model: values.pricingModel === 'crr' ? 'crr' : 'bs',
        },
      };
    },
  },
  'implied-volatility': {
    id: 'implied-volatility',
    title: 'Implied Volatility',
    fields: [
      { key: 'stockPrice', label: 'Stock Price ($)', defaultValue: '100' },
      { key: 'strike', label: 'Strike Price ($)', defaultValue: '100' },
      { key: 'optionPrice', label: 'Option Price ($)', defaultValue: '5.50' },
      { key: 'dte', label: 'Days to Expiration', defaultValue: '30' },
      { key: 'riskFreeRate', label: 'Risk-Free Rate (%)', defaultValue: '4.5' },
      { key: 'dividendYield', label: 'Dividend Yield (%)', defaultValue: '0' },
      { key: 'optionType', label: 'Option Type', defaultValue: 'call' },
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
      { key: 'strike', label: 'Strike Price', defaultValue: '100' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '45' },
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: ' (%)' },
      { key: 'riskFreeRate', label: 'Rate', defaultValue: '4.5', suffix: ' (%)' },
      { key: 'dividendYield', label: 'Div Yield', defaultValue: '0', suffix: ' (%)' },
      { key: 'optionType', label: 'Option Type', defaultValue: 'call' },
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
      { key: 'iv', label: 'IV', defaultValue: '30', suffix: ' (%)' },
      { key: 'dte', label: 'Days to Exp', defaultValue: '30' },
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
  const result = config.compute(values);
  if (!result) return null;
  return {
    ...result,
    visualization: buildCalculatorVisualization(configId, result, values),
  };
}
