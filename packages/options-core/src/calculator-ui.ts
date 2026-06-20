export type CalculatorFormMode =
  | 'standard'
  | 'iv-price'
  | 'spread-price'
  | 'pmcc-price'
  | 'expected-move'
  | 'theta-decay';

export const CALCULATOR_FORM_MODES: Record<string, CalculatorFormMode> = {
  'long-call': 'iv-price',
  'long-put': 'iv-price',
  'short-call': 'iv-price',
  'short-put': 'iv-price',
  'cash-secured-put': 'iv-price',
  'covered-call': 'iv-price',
  'bull-call-spread': 'spread-price',
  'bull-put-spread': 'spread-price',
  'bear-put-spread': 'spread-price',
  'bear-call-spread': 'spread-price',
  pmcc: 'pmcc-price',
  'expected-move': 'expected-move',
  'theta-decay': 'theta-decay',
};

export const IV_PRICE_CALCULATORS = new Set([
  'long-call',
  'long-put',
  'short-call',
  'short-put',
  'cash-secured-put',
  'covered-call',
]);

export const SPREAD_PRICE_CALCULATORS = new Set([
  'bull-call-spread',
  'bull-put-spread',
  'bear-put-spread',
  'bear-call-spread',
]);

export const PMCC_PRICE_CALCULATORS = new Set(['pmcc']);

export function getCalculatorFormMode(id: string): CalculatorFormMode {
  return CALCULATOR_FORM_MODES[id] ?? 'standard';
}

export function getDefaultFormValues(id: string): Record<string, string> {
  const extras: Record<string, string> = {};

  if (IV_PRICE_CALCULATORS.has(id)) {
    extras.calculationMode = 'iv';
    extras.optionPrice = '2.50';
  }

  if (SPREAD_PRICE_CALCULATORS.has(id)) {
    extras.calculationMode = 'iv';
    extras.longOptionPrice = '3.50';
    extras.shortOptionPrice = '1.00';
  }

  if (PMCC_PRICE_CALCULATORS.has(id)) {
    extras.calculationMode = 'price';
    extras.longOptionPrice = '40';
    extras.shortOptionPrice = '4';
    extras.longIv = '25';
    extras.shortIv = '25';
  }

  if (id === 'covered-call') {
    extras.optionPrice = '2.50';
  }

  return extras;
}
