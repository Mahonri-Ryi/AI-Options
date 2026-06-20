export type CalculatorFormMode =
  | 'standard'
  | 'iv-price'
  | 'spread-price'
  | 'pmcc-price'
  | 'volatility-price'
  | 'pricing-tool'
  | 'iv-tool'
  | 'expected-move'
  | 'theta-decay';

export interface CalculatorFormMeta {
  formMode: CalculatorFormMode;
  panelTitle: string;
  submitLabel: string;
  calculatedLabel: string;
  hasPositionToggle?: boolean;
  positionLabels?: { short: string; long: string; shortSub: string; longSub: string };
  priceFieldLabel?: { iv: string; price: string };
  hiddenFields?: string[];
}

export const CALCULATOR_FORM_META: Record<string, CalculatorFormMeta> = {
  'long-call': {
    formMode: 'iv-price',
    panelTitle: 'Option Parameters',
    submitLabel: 'Calculate P/L →',
    calculatedLabel: 'Calculated ✓',
    priceFieldLabel: { iv: 'IV', price: 'Price' },
  },
  'long-put': {
    formMode: 'iv-price',
    panelTitle: 'Option Parameters',
    submitLabel: 'Calculate P/L →',
    calculatedLabel: 'Calculated ✓',
    priceFieldLabel: { iv: 'IV', price: 'Price' },
  },
  'short-call': {
    formMode: 'iv-price',
    panelTitle: 'Option Parameters',
    submitLabel: 'Calculate P/L →',
    calculatedLabel: 'Calculated ✓',
    priceFieldLabel: { iv: 'IV', price: 'Price' },
  },
  'short-put': {
    formMode: 'iv-price',
    panelTitle: 'Option Parameters',
    submitLabel: 'Calculate P/L →',
    calculatedLabel: 'Calculated ✓',
    priceFieldLabel: { iv: 'IV', price: 'Price' },
  },
  'bull-call-spread': {
    formMode: 'spread-price',
    panelTitle: 'Spread Parameters',
    submitLabel: 'Calculate P/L →',
    calculatedLabel: 'Calculated ✓',
    priceFieldLabel: { iv: 'IV', price: 'Prices' },
  },
  'bull-put-spread': {
    formMode: 'spread-price',
    panelTitle: 'Spread Parameters',
    submitLabel: 'Calculate P/L →',
    calculatedLabel: 'Calculated ✓',
    priceFieldLabel: { iv: 'IV', price: 'Prices' },
  },
  'bear-put-spread': {
    formMode: 'spread-price',
    panelTitle: 'Spread Parameters',
    submitLabel: 'Calculate P/L →',
    calculatedLabel: 'Calculated ✓',
    priceFieldLabel: { iv: 'IV', price: 'Prices' },
  },
  'bear-call-spread': {
    formMode: 'spread-price',
    panelTitle: 'Spread Parameters',
    submitLabel: 'Calculate P/L →',
    calculatedLabel: 'Calculated ✓',
    priceFieldLabel: { iv: 'IV', price: 'Prices' },
  },
  'covered-call': {
    formMode: 'iv-price',
    panelTitle: 'Option Parameters',
    submitLabel: 'Calculate P/L →',
    calculatedLabel: 'Calculated ✓',
    priceFieldLabel: { iv: 'IV', price: 'Price' },
  },
  'cash-secured-put': {
    formMode: 'iv-price',
    panelTitle: 'Option Parameters',
    submitLabel: 'Calculate P/L →',
    calculatedLabel: 'Calculated ✓',
    priceFieldLabel: { iv: 'IV', price: 'Price' },
  },
  pmcc: {
    formMode: 'pmcc-price',
    panelTitle: 'PMCC Parameters',
    submitLabel: 'Calculate P/L →',
    calculatedLabel: 'Calculated ✓',
    priceFieldLabel: { iv: 'IV', price: 'Prices' },
    hiddenFields: ['iv'],
  },
  straddle: {
    formMode: 'volatility-price',
    panelTitle: 'Straddle Parameters',
    submitLabel: 'Calculate P/L →',
    calculatedLabel: 'Calculated ✓',
    hasPositionToggle: true,
    positionLabels: {
      short: 'Short Straddle',
      long: 'Long Straddle',
      shortSub: 'Collect credit',
      longSub: 'Pay debit',
    },
    priceFieldLabel: { iv: 'IV', price: 'Credit' },
  },
  strangle: {
    formMode: 'volatility-price',
    panelTitle: 'Strangle Parameters',
    submitLabel: 'Calculate P/L →',
    calculatedLabel: 'Calculated ✓',
    hasPositionToggle: true,
    positionLabels: {
      short: 'Short Strangle',
      long: 'Long Strangle',
      shortSub: 'Collect credit',
      longSub: 'Pay debit',
    },
    priceFieldLabel: { iv: 'IV', price: 'Credit' },
  },
  'iron-condor': {
    formMode: 'volatility-price',
    panelTitle: 'Iron Condor Parameters',
    submitLabel: 'Calculate P/L →',
    calculatedLabel: 'Calculated ✓',
    hasPositionToggle: true,
    positionLabels: {
      short: 'Short Iron Condor',
      long: 'Long Iron Condor',
      shortSub: 'Collect credit',
      longSub: 'Pay debit',
    },
    priceFieldLabel: { iv: 'IV', price: 'Credit' },
  },
  'iron-butterfly': {
    formMode: 'volatility-price',
    panelTitle: 'Iron Butterfly Parameters',
    submitLabel: 'Calculate P/L →',
    calculatedLabel: 'Calculated ✓',
    hasPositionToggle: true,
    positionLabels: {
      short: 'Short Iron Butterfly',
      long: 'Long Iron Butterfly',
      shortSub: 'Collect credit',
      longSub: 'Pay debit',
    },
    priceFieldLabel: { iv: 'IV', price: 'Credit' },
  },
  'options-pricing': {
    formMode: 'pricing-tool',
    panelTitle: 'Pricing Parameters',
    submitLabel: 'Calculate Prices',
    calculatedLabel: 'Calculated ✓',
  },
  'implied-volatility': {
    formMode: 'iv-tool',
    panelTitle: 'IV Parameters',
    submitLabel: 'Calculate IV',
    calculatedLabel: 'Calculated ✓',
    hiddenFields: ['optionType'],
  },
  'theta-decay': {
    formMode: 'theta-decay',
    panelTitle: 'Option Parameters',
    submitLabel: 'Calculate →',
    calculatedLabel: 'Calculated ✓',
    hiddenFields: ['optionType'],
  },
  'expected-move': {
    formMode: 'expected-move',
    panelTitle: 'Expected Move Parameters',
    submitLabel: 'Calculate →',
    calculatedLabel: 'Calculated ✓',
  },
};

export function getCalculatorFormMeta(id: string): CalculatorFormMeta {
  return (
    CALCULATOR_FORM_META[id] ?? {
      formMode: 'standard',
      panelTitle: 'Option Parameters',
      submitLabel: 'Calculate P/L →',
      calculatedLabel: 'Calculated ✓',
    }
  );
}

export function getCalculatorFormMode(id: string): CalculatorFormMode {
  return getCalculatorFormMeta(id).formMode;
}

export function getDefaultFormValues(id: string): Record<string, string> {
  const extras: Record<string, string> = {};

  const ivPrice = new Set([
    'long-call',
    'long-put',
    'short-call',
    'short-put',
    'cash-secured-put',
    'covered-call',
  ]);
  const spreadPrice = new Set([
    'bull-call-spread',
    'bull-put-spread',
    'bear-put-spread',
    'bear-call-spread',
  ]);
  const volPrice = new Set(['straddle', 'strangle', 'iron-condor', 'iron-butterfly']);

  if (ivPrice.has(id)) {
    extras.calculationMode = 'iv';
    extras.optionPrice = '2.50';
  }
  if (spreadPrice.has(id)) {
    extras.calculationMode = 'iv';
    if (id === 'bull-put-spread') {
      extras.longOptionPrice = '1.00';
      extras.shortOptionPrice = '3.50';
    } else if (id === 'bear-call-spread') {
      extras.longOptionPrice = '0.75';
      extras.shortOptionPrice = '2.00';
    } else {
      extras.longOptionPrice = '3.50';
      extras.shortOptionPrice = '1.00';
    }
  }
  if (id === 'pmcc') {
    extras.calculationMode = 'price';
    extras.longOptionPrice = '40';
    extras.shortOptionPrice = '4';
    extras.longIv = '45';
    extras.shortIv = '47';
  }
  if (volPrice.has(id)) {
    extras.calculationMode = 'iv';
    extras.positionType = 'short';
    if (id === 'straddle') extras.netPremiumInput = '5';
    if (id === 'strangle') extras.netPremiumInput = '3';
    if (id === 'iron-condor') extras.netCreditInput = '5';
    if (id === 'iron-butterfly') extras.netCreditInput = '8';
  }
  if (id === 'options-pricing') {
    extras.pricingModel = 'bs';
    extras.binomialSteps = '50';
  }
  if (id === 'implied-volatility') {
    extras.optionType = 'call';
  }
  if (id === 'theta-decay') {
    extras.optionType = 'call';
  }

  return extras;
}

export function shouldShowFormField(
  calculatorId: string,
  fieldKey: string,
  values: Record<string, string>,
): boolean {
  const meta = getCalculatorFormMeta(calculatorId);
  if (meta.hiddenFields?.includes(fieldKey)) return false;

  const mode = values.calculationMode ?? 'iv';
  const formMode = meta.formMode;

  if (fieldKey === 'iv') {
    if (formMode === 'iv-price' || formMode === 'spread-price' || formMode === 'volatility-price') {
      return mode === 'iv';
    }
    if (formMode === 'pmcc-price') return false;
    return true;
  }
  if (fieldKey === 'longIv' || fieldKey === 'shortIv') {
    return formMode === 'pmcc-price' && mode === 'iv';
  }
  if (fieldKey === 'optionPrice') {
    if (formMode === 'iv-price') return mode === 'price';
    if (formMode === 'iv-tool') return true;
    if (formMode === 'volatility-price') {
      return mode === 'price' && values.positionType === 'long';
    }
    return false;
  }
  if (fieldKey === 'netPremiumInput') {
    return (
      formMode === 'volatility-price' &&
      mode === 'price' &&
      values.positionType !== 'long' &&
      calculatorId !== 'iron-condor' &&
      calculatorId !== 'iron-butterfly'
    );
  }
  if (fieldKey === 'netCreditInput') {
    return (
      formMode === 'volatility-price' &&
      mode === 'price' &&
      (calculatorId === 'iron-condor' || calculatorId === 'iron-butterfly')
    );
  }
  if (fieldKey === 'longOptionPrice' || fieldKey === 'shortOptionPrice') {
    return (formMode === 'spread-price' || formMode === 'pmcc-price') && mode === 'price';
  }
  if (fieldKey === 'positionType') return false;
  if (fieldKey === 'optionType') {
    return formMode !== 'theta-decay' && formMode !== 'iv-tool';
  }
  if (fieldKey === 'pricingModel' || fieldKey === 'binomialSteps') {
    return false;
  }
  if (fieldKey === 'bodyStrike') {
    return calculatorId === 'iron-butterfly';
  }
  if (fieldKey === 'shortPutStrike' || fieldKey === 'shortCallStrike') {
    return calculatorId !== 'iron-butterfly';
  }

  return true;
}
