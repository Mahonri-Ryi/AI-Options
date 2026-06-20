import type { CalculatorResult, Greeks, OptionLeg, StockLeg } from '../types.js';
import { calculateGreeks, optionPrice } from '../math/black-scholes.js';
import {
  aggregateGreeks,
  buildPnLCurve,
  evaluateOptionLeg,
  evaluateStockLeg,
  findBreakevens,
  findMaxProfitLoss,
  generatePriceRange,
  legGreeks,
} from '../math/curve.js';
import { impliedVolatility } from '../math/volatility.js';

export interface BaseInputs {
  stockPrice: number;
  dte: number;
  riskFreeRate: number;
  dividendYield: number;
  quantity: number;
  calculationMode: 'iv' | 'price';
  iv?: number;
  optionPrice?: number;
}

export interface SingleLegInputs extends BaseInputs {
  strike: number;
  type: 'call' | 'put';
  side: 'long' | 'short';
}

export interface SpreadInputs extends BaseInputs {
  longStrike: number;
  shortStrike: number;
  longType: 'call' | 'put';
  longOptionPrice?: number;
  shortOptionPrice?: number;
  longIv?: number;
  shortIv?: number;
}

export interface StraddleInputs extends BaseInputs {
  strike: number;
  positionType: 'long' | 'short';
  netPremiumInput?: number;
}

export interface StrangleInputs extends BaseInputs {
  callStrike: number;
  putStrike: number;
  positionType: 'long' | 'short';
  netPremiumInput?: number;
}

export interface IronCondorInputs extends BaseInputs {
  longPutStrike: number;
  shortPutStrike: number;
  shortCallStrike: number;
  longCallStrike: number;
  positionType: 'long' | 'short';
  netCreditInput?: number;
}

export interface CoveredCallInputs extends BaseInputs {
  strike: number;
  shareCostBasis: number;
  callPremium?: number;
}

export interface PMCCInputs extends BaseInputs {
  longStrike: number;
  shortStrike: number;
  longDte: number;
  shortDte: number;
  longPremium?: number;
  shortPremium?: number;
  longIv?: number;
  shortIv?: number;
}

function resolvePremium(
  type: 'call' | 'put',
  inputs: BaseInputs & { strike: number; iv?: number; optionPrice?: number },
): number {
  if (inputs.calculationMode === 'price' && inputs.optionPrice !== undefined) {
    return inputs.optionPrice;
  }

  const iv = inputs.iv ?? 25;
  return optionPrice(
    type,
    inputs.stockPrice,
    inputs.strike,
    inputs.dte,
    iv,
    inputs.riskFreeRate,
    inputs.dividendYield,
  );
}

function singleLegMetrics(
  leg: OptionLeg,
  premium: number,
): { maxProfit: number | 'unlimited'; maxLoss: number | 'unlimited' } {
  const maxPremium = premium * 100 * leg.quantity;

  if (leg.side === 'long') {
    return { maxProfit: 'unlimited', maxLoss: maxPremium };
  }

  if (leg.type === 'call') {
    return { maxProfit: maxPremium, maxLoss: 'unlimited' };
  }

  return { maxProfit: maxPremium, maxLoss: (leg.strike - premium) * 100 * leg.quantity };
}

function buildSingleLegResult(
  inputs: SingleLegInputs,
  atExpiration = true,
): CalculatorResult {
  const premium = resolvePremium(inputs.type, inputs);
  const leg: OptionLeg = {
    type: inputs.type,
    side: inputs.side,
    strike: inputs.strike,
    quantity: inputs.quantity,
    premium,
  };

  const iv = inputs.calculationMode === 'iv'
    ? (inputs.iv ?? 25)
    : impliedVolatility(
        inputs.type,
        inputs.optionPrice!,
        inputs.stockPrice,
        inputs.strike,
        inputs.dte,
        inputs.riskFreeRate,
        inputs.dividendYield,
      );

  const range = generatePriceRange(inputs.stockPrice, [inputs.strike]);
  const curve = buildPnLCurve(
    (price) =>
      evaluateOptionLeg(
        leg,
        price,
        atExpiration,
        inputs.dte,
        iv,
        inputs.riskFreeRate,
        inputs.dividendYield,
      ),
    range.min,
    range.max,
  );

  const { maxProfit, maxLoss } = singleLegMetrics(leg, premium);
  const greeks = legGreeks(
    leg,
    inputs.stockPrice,
    inputs.dte,
    iv,
    inputs.riskFreeRate,
    inputs.dividendYield,
  );
  const signedGreeks = scaleGreeks(greeks, inputs.side === 'long' ? 1 : -1, inputs.quantity);

  return {
    metrics: {
      maxProfit,
      maxLoss,
      breakevens: findBreakevens(curve),
      netPremium: inputs.side === 'short' ? premium : -premium,
      premium,
      greeks: signedGreeks,
    },
    curve,
    greeks: signedGreeks,
  };
}

function scaleGreeks(greeks: Greeks, sign: number, quantity: number): Greeks {
  return {
    delta: greeks.delta * sign * quantity,
    gamma: greeks.gamma * sign * quantity,
    theta: greeks.theta * sign * quantity,
    vega: greeks.vega * sign * quantity,
    rho: greeks.rho * sign * quantity,
  };
}

function buildVerticalSpread(
  inputs: SpreadInputs,
  longType: 'call' | 'put',
  shortType: 'call' | 'put',
): CalculatorResult {
  const longPremium =
    inputs.calculationMode === 'price'
      ? (inputs.longOptionPrice ?? 0)
      : optionPrice(
          longType,
          inputs.stockPrice,
          inputs.longStrike,
          inputs.dte,
          inputs.longIv ?? inputs.iv ?? 25,
          inputs.riskFreeRate,
          inputs.dividendYield,
        );

  const shortPremium =
    inputs.calculationMode === 'price'
      ? (inputs.shortOptionPrice ?? 0)
      : optionPrice(
          shortType,
          inputs.stockPrice,
          inputs.shortStrike,
          inputs.dte,
          inputs.shortIv ?? inputs.iv ?? 25,
          inputs.riskFreeRate,
          inputs.dividendYield,
        );

  const netDebit = longPremium - shortPremium;
  const debit = Math.abs(netDebit);
  const isCredit = netDebit < 0;
  const netPremium = isCredit ? debit : -debit;

  const longLeg: OptionLeg = {
    type: longType,
    side: 'long',
    strike: inputs.longStrike,
    quantity: inputs.quantity,
    premium: longPremium,
  };
  const shortLeg: OptionLeg = {
    type: shortType,
    side: 'short',
    strike: inputs.shortStrike,
    quantity: inputs.quantity,
    premium: shortPremium,
  };

  const iv = inputs.iv ?? 25;
  const range = generatePriceRange(inputs.stockPrice, [inputs.longStrike, inputs.shortStrike]);
  const curve = buildPnLCurve((price) => {
    return (
      evaluateOptionLeg(longLeg, price, true, inputs.dte, iv, inputs.riskFreeRate, inputs.dividendYield) +
      evaluateOptionLeg(shortLeg, price, true, inputs.dte, iv, inputs.riskFreeRate, inputs.dividendYield)
    );
  }, range.min, range.max);

  const width = Math.abs(inputs.shortStrike - inputs.longStrike);
  const maxProfit = isCredit
    ? debit * 100 * inputs.quantity
    : (width - debit) * 100 * inputs.quantity;
  const maxLoss = isCredit
    ? (width - debit) * 100 * inputs.quantity
    : debit * 100 * inputs.quantity;

  const greeks = aggregateGreeks(
    [longLeg, shortLeg],
    [
      legGreeks(longLeg, inputs.stockPrice, inputs.dte, iv, inputs.riskFreeRate, inputs.dividendYield),
      legGreeks(shortLeg, inputs.stockPrice, inputs.dte, iv, inputs.riskFreeRate, inputs.dividendYield),
    ],
  );

  return {
    metrics: {
      maxProfit,
      maxLoss,
      breakevens: findBreakevens(curve),
      netPremium,
      premium: longPremium,
      greeks,
    },
    curve,
    greeks,
  };
}

export function longCall(inputs: SingleLegInputs): CalculatorResult {
  return buildSingleLegResult({ ...inputs, type: 'call', side: 'long' });
}

export function longPut(inputs: SingleLegInputs): CalculatorResult {
  return buildSingleLegResult({ ...inputs, type: 'put', side: 'long' });
}

export function shortCall(inputs: SingleLegInputs): CalculatorResult {
  return buildSingleLegResult({ ...inputs, type: 'call', side: 'short' });
}

export function shortPut(inputs: SingleLegInputs): CalculatorResult {
  return buildSingleLegResult({ ...inputs, type: 'put', side: 'short' });
}

export function bullCallSpread(inputs: SpreadInputs): CalculatorResult {
  return buildVerticalSpread(
    { ...inputs, longStrike: inputs.longStrike, shortStrike: inputs.shortStrike },
    'call',
    'call',
  );
}

export function bearCallSpread(inputs: SpreadInputs): CalculatorResult {
  return buildVerticalSpread(inputs, 'call', 'call');
}

export function bullPutSpread(inputs: SpreadInputs): CalculatorResult {
  return buildVerticalSpread(inputs, 'put', 'put');
}

export function bearPutSpread(inputs: SpreadInputs): CalculatorResult {
  return buildVerticalSpread(inputs, 'put', 'put');
}

export function straddle(inputs: StraddleInputs): CalculatorResult {
  const iv = inputs.iv ?? 25;
  const callPremium = optionPrice(
    'call',
    inputs.stockPrice,
    inputs.strike,
    inputs.dte,
    iv,
    inputs.riskFreeRate,
    inputs.dividendYield,
  );
  const putPremium = optionPrice(
    'put',
    inputs.stockPrice,
    inputs.strike,
    inputs.dte,
    iv,
    inputs.riskFreeRate,
    inputs.dividendYield,
  );
  const netPremium =
    inputs.calculationMode === 'price'
      ? (inputs.netPremiumInput ?? callPremium + putPremium)
      : callPremium + putPremium;

  const side = inputs.positionType === 'long' ? 'long' : 'short';
  const callLeg: OptionLeg = { type: 'call', side, strike: inputs.strike, quantity: inputs.quantity, premium: callPremium };
  const putLeg: OptionLeg = { type: 'put', side, strike: inputs.strike, quantity: inputs.quantity, premium: putPremium };

  const range = generatePriceRange(inputs.stockPrice, [inputs.strike]);
  const curve = buildPnLCurve((price) => {
    return (
      evaluateOptionLeg(callLeg, price, true, inputs.dte, iv, inputs.riskFreeRate, inputs.dividendYield) +
      evaluateOptionLeg(putLeg, price, true, inputs.dte, iv, inputs.riskFreeRate, inputs.dividendYield)
    );
  }, range.min, range.max);

  const { maxProfit, maxLoss } = findMaxProfitLoss(curve);

  return {
    metrics: {
      maxProfit,
      maxLoss,
      breakevens: findBreakevens(curve),
      netPremium: side === 'short' ? netPremium : -netPremium,
      premium: netPremium,
    },
    curve,
  };
}

export function strangle(inputs: StrangleInputs): CalculatorResult {
  const iv = inputs.iv ?? 25;
  const callPremium = optionPrice(
    'call',
    inputs.stockPrice,
    inputs.callStrike,
    inputs.dte,
    iv,
    inputs.riskFreeRate,
    inputs.dividendYield,
  );
  const putPremium = optionPrice(
    'put',
    inputs.stockPrice,
    inputs.putStrike,
    inputs.dte,
    iv,
    inputs.riskFreeRate,
    inputs.dividendYield,
  );
  const netPremium =
    inputs.calculationMode === 'price'
      ? (inputs.netPremiumInput ?? callPremium + putPremium)
      : callPremium + putPremium;

  const side = inputs.positionType === 'long' ? 'long' : 'short';
  const callLeg: OptionLeg = { type: 'call', side, strike: inputs.callStrike, quantity: inputs.quantity, premium: callPremium };
  const putLeg: OptionLeg = { type: 'put', side, strike: inputs.putStrike, quantity: inputs.quantity, premium: putPremium };

  const range = generatePriceRange(inputs.stockPrice, [inputs.callStrike, inputs.putStrike]);
  const curve = buildPnLCurve((price) => {
    return (
      evaluateOptionLeg(callLeg, price, true, inputs.dte, iv, inputs.riskFreeRate, inputs.dividendYield) +
      evaluateOptionLeg(putLeg, price, true, inputs.dte, iv, inputs.riskFreeRate, inputs.dividendYield)
    );
  }, range.min, range.max);

  const { maxProfit, maxLoss } = findMaxProfitLoss(curve);

  return {
    metrics: {
      maxProfit,
      maxLoss,
      breakevens: findBreakevens(curve),
      netPremium: side === 'short' ? netPremium : -netPremium,
      premium: netPremium,
    },
    curve,
  };
}

export function ironCondor(inputs: IronCondorInputs): CalculatorResult {
  const iv = inputs.iv ?? 25;
  const legs: OptionLeg[] = [
    { type: 'put', side: 'long', strike: inputs.longPutStrike, quantity: inputs.quantity, premium: optionPrice('put', inputs.stockPrice, inputs.longPutStrike, inputs.dte, iv, inputs.riskFreeRate, inputs.dividendYield) },
    { type: 'put', side: 'short', strike: inputs.shortPutStrike, quantity: inputs.quantity, premium: optionPrice('put', inputs.stockPrice, inputs.shortPutStrike, inputs.dte, iv, inputs.riskFreeRate, inputs.dividendYield) },
    { type: 'call', side: 'short', strike: inputs.shortCallStrike, quantity: inputs.quantity, premium: optionPrice('call', inputs.stockPrice, inputs.shortCallStrike, inputs.dte, iv, inputs.riskFreeRate, inputs.dividendYield) },
    { type: 'call', side: 'long', strike: inputs.longCallStrike, quantity: inputs.quantity, premium: optionPrice('call', inputs.stockPrice, inputs.longCallStrike, inputs.dte, iv, inputs.riskFreeRate, inputs.dividendYield) },
  ];

  if (inputs.positionType === 'long') {
    legs.forEach((leg) => {
      leg.side = leg.side === 'long' ? 'short' : 'long';
    });
  }

  const netPremium = legs.reduce((sum, leg) => sum + (leg.side === 'short' ? leg.premium : -leg.premium), 0);
  const range = generatePriceRange(inputs.stockPrice, legs.map((l) => l.strike));
  const curve = buildPnLCurve((price) => {
    return legs.reduce(
      (sum, leg) =>
        sum + evaluateOptionLeg(leg, price, true, inputs.dte, iv, inputs.riskFreeRate, inputs.dividendYield),
      0,
    );
  }, range.min, range.max);

  const putWidth = inputs.shortPutStrike - inputs.longPutStrike;
  const callWidth = inputs.longCallStrike - inputs.shortCallStrike;
  const wingWidth = Math.max(putWidth, callWidth);

  return {
    metrics: {
      maxProfit: netPremium * 100 * inputs.quantity,
      maxLoss: (wingWidth - netPremium) * 100 * inputs.quantity,
      breakevens: findBreakevens(curve),
      netPremium,
      premium: netPremium,
    },
    curve,
  };
}

export function ironButterfly(inputs: IronCondorInputs): CalculatorResult {
  const bodyStrike = inputs.shortPutStrike;
  return ironCondor({
    ...inputs,
    shortPutStrike: bodyStrike,
    shortCallStrike: bodyStrike,
  });
}

export function coveredCall(inputs: CoveredCallInputs): CalculatorResult {
  const iv = inputs.iv ?? 25;
  const callPremium =
    inputs.calculationMode === 'price'
      ? (inputs.callPremium ?? inputs.optionPrice ?? 2)
      : optionPrice(
          'call',
          inputs.stockPrice,
          inputs.strike,
          inputs.dte,
          iv,
          inputs.riskFreeRate,
          inputs.dividendYield,
        );

  const stockLeg: StockLeg = {
    side: 'long',
    quantity: inputs.quantity,
    costBasis: inputs.shareCostBasis,
  };
  const callLeg: OptionLeg = {
    type: 'call',
    side: 'short',
    strike: inputs.strike,
    quantity: inputs.quantity,
    premium: callPremium,
  };

  const range = generatePriceRange(inputs.stockPrice, [inputs.strike, inputs.shareCostBasis]);
  const curve = buildPnLCurve((price) => {
    return (
      evaluateStockLeg(stockLeg, price) +
      evaluateOptionLeg(callLeg, price, true, inputs.dte, iv, inputs.riskFreeRate, inputs.dividendYield)
    );
  }, range.min, range.max);

  const maxProfit = (inputs.strike - inputs.shareCostBasis + callPremium) * 100 * inputs.quantity;
  const maxLoss = (inputs.shareCostBasis - callPremium) * 100 * inputs.quantity;

  return {
    metrics: {
      maxProfit,
      maxLoss,
      breakevens: findBreakevens(curve),
      netPremium: callPremium,
      premium: callPremium,
    },
    curve,
  };
}

export function cashSecuredPut(inputs: SingleLegInputs): CalculatorResult {
  return buildSingleLegResult({ ...inputs, type: 'put', side: 'short' });
}

export function poorMansCoveredCall(inputs: PMCCInputs): CalculatorResult {
  const longIv = inputs.longIv ?? inputs.iv ?? 25;
  const shortIv = inputs.shortIv ?? inputs.iv ?? 25;
  const longPremium =
    inputs.calculationMode === 'price'
      ? (inputs.longPremium ?? 10)
      : optionPrice(
          'call',
          inputs.stockPrice,
          inputs.longStrike,
          inputs.longDte,
          longIv,
          inputs.riskFreeRate,
          inputs.dividendYield,
        );
  const shortPremium =
    inputs.calculationMode === 'price'
      ? (inputs.shortPremium ?? 2)
      : optionPrice(
          'call',
          inputs.stockPrice,
          inputs.shortStrike,
          inputs.shortDte,
          shortIv,
          inputs.riskFreeRate,
          inputs.dividendYield,
        );

  const longLeg: OptionLeg = {
    type: 'call',
    side: 'long',
    strike: inputs.longStrike,
    quantity: inputs.quantity,
    premium: longPremium,
  };
  const shortLeg: OptionLeg = {
    type: 'call',
    side: 'short',
    strike: inputs.shortStrike,
    quantity: inputs.quantity,
    premium: shortPremium,
  };

  const range = generatePriceRange(inputs.stockPrice, [inputs.longStrike, inputs.shortStrike]);
  const curve = buildPnLCurve((price) => {
    return (
      evaluateOptionLeg(longLeg, price, true, inputs.longDte, longIv, inputs.riskFreeRate, inputs.dividendYield) +
      evaluateOptionLeg(shortLeg, price, true, inputs.shortDte, shortIv, inputs.riskFreeRate, inputs.dividendYield)
    );
  }, range.min, range.max);

  return {
    metrics: {
      maxProfit: findMaxProfitLoss(curve).maxProfit,
      maxLoss: longPremium * 100 * inputs.quantity,
      breakevens: findBreakevens(curve),
      netPremium: shortPremium - longPremium,
      premium: longPremium,
    },
    curve,
  };
}

export function optionsPricing(inputs: {
  stockPrice: number;
  strike: number;
  dte: number;
  iv: number;
  riskFreeRate: number;
  dividendYield: number;
  type: 'call' | 'put';
}): { price: number; greeks: Greeks } {
  const price = optionPrice(
    inputs.type,
    inputs.stockPrice,
    inputs.strike,
    inputs.dte,
    inputs.iv,
    inputs.riskFreeRate,
    inputs.dividendYield,
  );
  const greeks = calculateGreeks(
    inputs.type,
    inputs.stockPrice,
    inputs.strike,
    inputs.dte,
    inputs.iv,
    inputs.riskFreeRate,
    inputs.dividendYield,
  );
  return { price, greeks };
}

export { expectedMove, impliedVolatility, thetaDecayCurve } from '../math/volatility.js';
