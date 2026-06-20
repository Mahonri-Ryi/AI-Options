import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CALCULATOR_CONFIGS,
  computeCalculator,
  getCalculatorFormMeta,
  getDefaultValues,
  shouldShowFormField,
} from '@ai-options/core';
import { ExpectedMoveChart } from '../components/ExpectedMoveChart';
import { IVResults } from '../components/IVResults';
import { ModeToggle } from '../components/ModeToggle';
import { NumberField } from '../components/NumberField';
import { PnLChart } from '../components/PnLChart';
import { PositionToggle } from '../components/PositionToggle';
import { PricingResults } from '../components/PricingResults';
import { ResultsPanel } from '../components/ResultsPanel';
import { ExpectedMoveResults, ThetaDecayResults } from '../components/SpecialResultsPanel';
import { ThetaDecayChart } from '../components/ThetaDecayChart';
import './CalculatorPage.css';
import '../components/ModeToggle.css';
import '../components/PositionToggle.css';

function valuesEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] ?? '') !== (b[key] ?? '')) return false;
  }
  return true;
}

export function CalculatorPage() {
  const { id = 'long-call' } = useParams();
  const config = CALCULATOR_CONFIGS[id];
  const formMeta = getCalculatorFormMeta(id);
  const formMode = formMeta.formMode;

  const [values, setValues] = useState<Record<string, string>>(() => getDefaultValues(id));
  const [calculatedValues, setCalculatedValues] = useState<Record<string, string>>(() =>
    getDefaultValues(id),
  );
  const [result, setResult] = useState(() => computeCalculator(id, getDefaultValues(id)));

  useEffect(() => {
    const defaults = getDefaultValues(id);
    setValues(defaults);
    setCalculatedValues(defaults);
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
  const isDirty = !valuesEqual(values, calculatedValues);
  const isCalculated = !isDirty;

  const visibleFields = useMemo(
    () => config.fields.filter((field) => shouldShowFormField(id, field.key, values)),
    [config.fields, id, values],
  );

  const handleCalculate = () => {
    const next = computeCalculator(id, values);
    setCalculatedValues({ ...values });
    setResult(next);
  };

  const updateValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const isSpecialLayout = formMode === 'expected-move' || formMode === 'theta-decay';
  const showPnLChart =
    !isSpecialLayout &&
    formMode !== 'pricing-tool' &&
    formMode !== 'iv-tool' &&
    result &&
    result.curve.length > 1;

  const calcMode = values.calculationMode ?? 'iv';
  const priceToggleOptions = formMeta.priceFieldLabel
    ? [
        { value: 'iv', label: formMeta.priceFieldLabel.iv },
        { value: 'price', label: formMeta.priceFieldLabel.price },
      ]
    : [
        { value: 'iv', label: 'IV' },
        { value: 'price', label: 'Price' },
      ];

  return (
    <div className={`page calculator-page ${isSpecialLayout ? 'calculator-page-wide' : ''}`}>
      <header className="calc-header">
        <h1 className="calc-title">{config.title}</h1>
        <p className="calc-desc">Adjust parameters and calculate your profit/loss profile.</p>
      </header>

      <div className="calculator">
        <div className={`calculator-content ${isSpecialLayout ? 'calculator-content-stacked' : ''}`}>
          <section className="calculator-input card form-panel">
            {formMeta.hasPositionToggle && formMeta.positionLabels ? (
              <PositionToggle
                value={values.positionType === 'long' ? 'long' : 'short'}
                shortLabel={formMeta.positionLabels.short}
                longLabel={formMeta.positionLabels.long}
                shortSubtitle={formMeta.positionLabels.shortSub}
                longSubtitle={formMeta.positionLabels.longSub}
                onChange={(position) => updateValue('positionType', position)}
              />
            ) : null}

            <div className="form-panel-header">
              <h2 className="panel-title">{formMeta.panelTitle}</h2>
            </div>

            {formMode === 'iv-price' || formMode === 'spread-price' || formMode === 'pmcc-price' ? (
              <ModeToggle
                label="Calculate with:"
                value={calcMode}
                options={
                  formMode === 'pmcc-price'
                    ? [
                        { value: 'price', label: 'Prices' },
                        { value: 'iv', label: 'IV' },
                      ]
                    : priceToggleOptions
                }
                onChange={(mode) => updateValue('calculationMode', mode)}
              />
            ) : null}

            {formMode === 'volatility-price' ? (
              <ModeToggle
                label="Calculate with:"
                value={calcMode}
                options={priceToggleOptions}
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

            {formMode === 'iv-tool' ? (
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

            {formMode === 'pricing-tool' ? (
              <ModeToggle
                label="Pricing Model:"
                value={values.pricingModel ?? 'bs'}
                options={[
                  { value: 'bs', label: 'Black-Scholes' },
                  { value: 'crr', label: 'Binomial' },
                ]}
                onChange={(model) => updateValue('pricingModel', model)}
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
              {formMode === 'pricing-tool' && values.pricingModel === 'crr' ? (
                <NumberField
                  key="binomialSteps"
                  label="Binomial Tree Steps"
                  value={values.binomialSteps ?? '50'}
                  onChange={(value) => updateValue('binomialSteps', value)}
                />
              ) : null}
            </div>

            <button
              type="button"
              className={`btn-primary btn-calculate ${isCalculated ? 'calculated' : ''} ${isDirty ? 'has-changes' : ''}`}
              onClick={handleCalculate}
            >
              {isCalculated ? formMeta.calculatedLabel : formMeta.submitLabel}
            </button>
          </section>

          <div className="calculator-results results-column">
            {formMode === 'expected-move' && result?.expectedMoveDetail ? (
              <ExpectedMoveResults detail={result.expectedMoveDetail} stockPrice={stockPrice} />
            ) : formMode === 'theta-decay' && result?.thetaDecayDetail ? (
              <ThetaDecayResults detail={result.thetaDecayDetail} />
            ) : formMode === 'pricing-tool' && result?.pricingResult ? (
              <PricingResults pricing={result.pricingResult} />
            ) : formMode === 'iv-tool' && result ? (
              <IVResults iv={result.metrics.premium} />
            ) : (
              <ResultsPanel result={result} />
            )}
          </div>
        </div>

        {formMode === 'expected-move' && result?.expectedMoveCone ? (
          <section className="chart-section chart-panel card chart-panel-full">
            <h2 className="panel-title">Expected Move Cone</h2>
            <ExpectedMoveChart
              cone={result.expectedMoveCone}
              stockPrice={stockPrice}
              maxDte={Number(values.dte) || 30}
            />
          </section>
        ) : null}

        {formMode === 'theta-decay' && result?.thetaDecayChart && result.thetaDecayDetail ? (
          <section className="chart-section chart-panel card chart-panel-full">
            <h2 className="panel-title">Theta Decay Curve</h2>
            <ThetaDecayChart
              data={result.thetaDecayChart}
              entryDte={result.thetaDecayDetail.entryDte}
              detail={result.thetaDecayDetail}
            />
            <p className="chart-model-note">
              {values.optionType === 'put'
                ? 'Put prices calculated using the binomial model.'
                : 'Call prices calculated using the Black-Scholes model.'}
            </p>
          </section>
        ) : null}

        {showPnLChart ? (
          <section className="chart-section chart-panel card chart-panel-full">
            <PnLChart
              visualization={result!.visualization}
              data={result!.curve}
              theoreticalData={result!.theoreticalCurve}
              currentPrice={stockPrice}
              chartAxes={result!.chartAxes}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}
