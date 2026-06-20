import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CALCULATOR_CONFIGS,
  computeCalculator,
  getCalculatorFormMode,
  getDefaultValues,
} from '@ai-options/core';
import { ExpectedMoveChart } from '../components/ExpectedMoveChart';
import { ModeToggle } from '../components/ModeToggle';
import { NumberField } from '../components/NumberField';
import { PnLChart } from '../components/PnLChart';
import { ResultsPanel } from '../components/ResultsPanel';
import { ExpectedMoveResults, ThetaDecayResults } from '../components/SpecialResultsPanel';
import { ThetaDecayChart } from '../components/ThetaDecayChart';
import './CalculatorPage.css';
import '../components/ModeToggle.css';

function shouldShowField(
  calculatorId: string,
  fieldKey: string,
  values: Record<string, string>,
): boolean {
  const formMode = getCalculatorFormMode(calculatorId);
  const calcMode = values.calculationMode ?? 'iv';

  if (fieldKey === 'iv') {
    if (formMode === 'iv-price' || formMode === 'spread-price') return calcMode === 'iv';
    return fieldKey === 'iv';
  }
  if (fieldKey === 'optionPrice') {
    return formMode === 'iv-price' && calcMode === 'price';
  }
  if (fieldKey === 'longOptionPrice' || fieldKey === 'shortOptionPrice') {
    return formMode === 'spread-price' && calcMode === 'price';
  }
  if (fieldKey === 'optionType' && calculatorId === 'theta-decay') {
    return false;
  }
  return true;
}

export function CalculatorPage() {
  const { id = 'long-call' } = useParams();
  const config = CALCULATOR_CONFIGS[id];
  const formMode = getCalculatorFormMode(id);
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
  const visibleFields = useMemo(
    () => config.fields.filter((field) => shouldShowField(id, field.key, values)),
    [config.fields, id, values],
  );

  const handleCalculate = () => {
    setResult(computeCalculator(id, values));
  };

  const updateValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const isSpecialLayout = formMode === 'expected-move' || formMode === 'theta-decay';

  return (
    <div className={`page calculator-page ${isSpecialLayout ? 'calculator-page-wide' : ''}`}>
      <header className="calc-header">
        <h1 className="calc-title">{config.title}</h1>
        <p className="calc-desc">Adjust parameters and calculate your profit/loss profile.</p>
      </header>

      <div className={`calc-layout ${isSpecialLayout ? 'calc-layout-stacked' : ''}`}>
        <section className="form-panel card">
          <div className="form-panel-header">
            <h2 className="panel-title">Option Parameters</h2>
          </div>

          {formMode === 'iv-price' || formMode === 'spread-price' ? (
            <ModeToggle
              label="Calculate with:"
              value={values.calculationMode ?? 'iv'}
              options={[
                { value: 'iv', label: 'IV' },
                { value: 'price', label: 'Price' },
              ]}
              onChange={(mode) => updateValue('calculationMode', mode)}
            />
          ) : null}

          {formMode === 'theta-decay' ? (
            <ModeToggle
              label="Option Type:"
              value={values.optionType ?? 'call'}
              options={[
                { value: 'call', label: 'Call' },
                { value: 'put', label: 'Put' },
              ]}
              onChange={(type) => updateValue('optionType', type)}
            />
          ) : null}

          <div className="field-grid">
            {visibleFields.map((field) => (
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
          {formMode === 'expected-move' && result?.expectedMoveDetail ? (
            <ExpectedMoveResults detail={result.expectedMoveDetail} stockPrice={stockPrice} />
          ) : formMode === 'theta-decay' && result?.thetaDecayDetail ? (
            <ThetaDecayResults detail={result.thetaDecayDetail} />
          ) : (
            <ResultsPanel result={result} />
          )}

          {id === 'implied-volatility' && result ? (
            <div className="highlight-card card">
              <span className="highlight-label">Implied Volatility</span>
              <span className="highlight-value">{result.metrics.premium.toFixed(2)}%</span>
            </div>
          ) : null}
        </div>
      </div>

      {formMode === 'expected-move' && result?.expectedMoveCone ? (
        <section className="chart-panel card chart-panel-full">
          <h2 className="panel-title">Expected Move Cone</h2>
          <ExpectedMoveChart
            cone={result.expectedMoveCone}
            stockPrice={stockPrice}
            maxDte={Number(values.dte) || 30}
          />
        </section>
      ) : null}

      {formMode === 'theta-decay' && result?.thetaDecayChart && result.thetaDecayDetail ? (
        <section className="chart-panel card chart-panel-full">
          <h2 className="panel-title">Theta Decay Curve</h2>
          <ThetaDecayChart data={result.thetaDecayChart} entryDte={result.thetaDecayDetail.entryDte} />
          <p className="chart-model-note">
            {values.optionType === 'put'
              ? 'Put prices calculated using the Black-Scholes model.'
              : 'Call prices calculated using the Black-Scholes model.'}
          </p>
        </section>
      ) : null}

      {!isSpecialLayout && result && result.curve.length > 1 ? (
        <section className="chart-panel card chart-panel-full">
          <h2 className="panel-title">P/L Chart</h2>
          <PnLChart
            data={result.curve}
            theoreticalData={result.theoreticalCurve}
            currentPrice={stockPrice}
            chartAxes={result.chartAxes}
          />
        </section>
      ) : null}
    </div>
  );
}
