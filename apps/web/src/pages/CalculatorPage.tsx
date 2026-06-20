import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CALCULATOR_CONFIGS,
  computeCalculator,
  getDefaultValues,
} from '@ai-options/core';
import { NumberField } from '../components/NumberField';
import { PnLChart } from '../components/PnLChart';
import { ResultsPanel } from '../components/ResultsPanel';
import './CalculatorPage.css';

export function CalculatorPage() {
  const { id = 'long-call' } = useParams();
  const config = CALCULATOR_CONFIGS[id];
  const [values, setValues] = useState<Record<string, string>>(() => getDefaultValues(id));
  const [result, setResult] = useState(() => computeCalculator(id, getDefaultValues(id)));

  useEffect(() => {
    const defaults = getDefaultValues(id);
    setValues(defaults);
    setResult(computeCalculator(id, defaults));
  }, [id]);

  if (!config) {
    return (
      <div className="page">
        <p className="error-text">Calculator not found.</p>
      </div>
    );
  }

  const stockPrice = Number(values.stockPrice) || 0;

  const handleCalculate = () => {
    setResult(computeCalculator(id, values));
  };

  const updateValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="page calculator-page">
      <header className="calc-header">
        <h1 className="calc-title">{config.title}</h1>
        <p className="calc-desc">Adjust parameters and calculate your profit/loss profile.</p>
      </header>

      <div className="calc-layout">
        <section className="form-panel card">
          <h2 className="panel-title">Option Parameters</h2>
          <div className="field-grid">
            {config.fields.map((field) => (
              <NumberField
                key={field.key}
                label={field.label}
                value={values[field.key] ?? field.defaultValue}
                suffix={field.suffix}
                onChange={(value) => updateValue(field.key, value)}
              />
            ))}
          </div>
          <button type="button" className="btn-primary" onClick={handleCalculate}>
            Calculate P/L →
          </button>
        </section>

        <div className="results-column">
          <ResultsPanel result={result} />

          {id === 'implied-volatility' && result ? (
            <div className="highlight-card card">
              <span className="highlight-label">Implied Volatility</span>
              <span className="highlight-value">{result.metrics.premium.toFixed(2)}%</span>
            </div>
          ) : null}

          {id === 'expected-move' && result ? (
            <div className="move-grid">
              <div className="move-card card">
                <span className="move-label">Expected Down</span>
                <span className="move-value">
                  ${typeof result.metrics.maxLoss === 'number' ? result.metrics.maxLoss.toFixed(2) : '—'}
                </span>
              </div>
              <div className="move-card card">
                <span className="move-label">Expected Up</span>
                <span className="move-value">
                  ${typeof result.metrics.maxProfit === 'number' ? result.metrics.maxProfit.toFixed(2) : '—'}
                </span>
              </div>
            </div>
          ) : null}

          {result && result.curve.length > 1 ? (
            <section className="chart-panel card">
              <h2 className="panel-title">
                {id === 'theta-decay' ? 'Theta Decay Curve' : 'P/L Chart'}
              </h2>
              <PnLChart
                data={result.curve}
                theoreticalData={result.theoreticalCurve}
                currentPrice={stockPrice}
                chartAxes={result.chartAxes}
              />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
