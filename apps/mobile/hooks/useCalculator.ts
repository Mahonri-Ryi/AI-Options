import { useMemo, useState } from 'react';
import type { CalculatorResult } from '@ai-options/core';
import {
  CALCULATOR_CONFIGS,
  computeCalculator,
  getDefaultValues,
} from '@ai-options/core';

export function useCalculator(configId: string) {
  const config = CALCULATOR_CONFIGS[configId];

  const initialValues = useMemo(() => getDefaultValues(configId), [configId]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [result, setResult] = useState<CalculatorResult | null>(null);

  const updateValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setResult(null);
  };

  const calculate = () => {
    if (!config) return;
    try {
      setResult(computeCalculator(configId, values));
    } catch (error) {
      console.error(error);
      setResult(null);
    }
  };

  return { config, values, updateValue, calculate, result };
}

export { CALCULATOR_CONFIGS };
