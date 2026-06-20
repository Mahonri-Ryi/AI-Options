import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  computeModelerResult,
  computeRollAnalyzer,
  DEMO_TRADES,
  getIncomeOpportunities,
  getPremiumFeatureById,
  screenIvUniverse,
  summarizeTrades,
} from '@ai-options/core';
import { MultiPnLChart } from '../components/MultiPnLChart';
import { NumberField } from '../components/NumberField';
import { PremiumGate } from '../components/PremiumGate';
import { ResultsPanel } from '../components/ResultsPanel';
import './ToolPage.css';

export function ToolPage() {
  const { id = '' } = useParams();
  const feature = getPremiumFeatureById(id);

  if (!feature) {
    return (
      <div className="page">
        <p className="error-text">Tool not found.</p>
      </div>
    );
  }

  return (
    <PremiumGate featureName={feature.name}>
      <div className="page tool-page">
        <header className="calc-header">
          <h1 className="calc-title">{feature.name}</h1>
          <p className="calc-desc">{feature.description}</p>
        </header>
        {id === 'option-modeler' && <OptionModeler />}
        {id === 'iv-screener' && <IvScreener />}
        {id === 'income-analyzer' && <IncomeAnalyzer />}
        {id === 'roll-analyzer' && <RollAnalyzer />}
        {id === 'trade-logger' && <TradeLogger />}
      </div>
    </PremiumGate>
  );
}

function OptionModeler() {
  const [stockPrice, setStockPrice] = useState('100');
  const [strike, setStrike] = useState('95');
  const [premium, setPremium] = useState('2.5');
  const [dte, setDte] = useState('30');
  const [iv, setIv] = useState('30');
  const [ivShift, setIvShift] = useState('0');
  const [side, setSide] = useState<'short' | 'long'>('short');
  const [type, setType] = useState<'put' | 'call'>('put');

  const result = useMemo(() => {
    const sp = Number(stockPrice) || 100;
    const str = Number(strike) || 95;
    const prem = Number(premium) || 2.5;
    const days = Number(dte) || 30;
    const ivPct = Number(iv) || 30;

    return computeModelerResult({
      stockPrice: sp,
      riskFreeRate: 4.5,
      dividendYield: 0,
      stockLegs: [],
      optionLegs: [
        {
          type,
          side,
          strike: str,
          quantity: 1,
          premium: prem,
          dte: days,
          ivPercent: ivPct,
        },
      ],
      ivShiftPercent: Number(ivShift) || 0,
    });
  }, [stockPrice, strike, premium, dte, iv, ivShift, side, type]);

  return (
    <div className="calc-layout">
      <section className="form-panel card">
        <h2 className="panel-title">Position</h2>
        <div className="field-grid">
          <div className="select-row">
            <label className="select-label">
              Side
              <select value={side} onChange={(e) => setSide(e.target.value as 'short' | 'long')}>
                <option value="short">Short</option>
                <option value="long">Long</option>
              </select>
            </label>
            <label className="select-label">
              Type
              <select value={type} onChange={(e) => setType(e.target.value as 'put' | 'call')}>
                <option value="put">Put</option>
                <option value="call">Call</option>
              </select>
            </label>
          </div>
          <NumberField label="Stock Price" value={stockPrice} suffix="$" onChange={setStockPrice} />
          <NumberField label="Strike" value={strike} suffix="$" onChange={setStrike} />
          <NumberField label="Premium" value={premium} suffix="$" onChange={setPremium} />
          <NumberField label="DTE" value={dte} onChange={setDte} />
          <NumberField label="IV" value={iv} suffix="%" onChange={setIv} />
          <NumberField label="IV Shift" value={ivShift} suffix="%" onChange={setIvShift} />
        </div>
      </section>

      <div className="results-column">
        <ResultsPanel result={{ ...result, curve: result.curves[0]?.curve ?? [] }} />
        <section className="chart-panel card">
          <h2 className="panel-title">P/L Over Time (T+0, T+50%, Expiration)</h2>
          <MultiPnLChart
            series={result.curves.map((c) => ({ label: c.label, data: c.curve }))}
            currentPrice={Number(stockPrice)}
          />
        </section>
      </div>
    </div>
  );
}

function IvScreener() {
  const [minRank, setMinRank] = useState('50');
  const results = useMemo(
    () => screenIvUniverse({ minIvRank: Number(minRank) || 0, sortBy: 'ivRank', sortDir: 'desc' }),
    [minRank],
  );

  return (
    <div className="tool-content">
      <div className="filter-bar card">
        <NumberField label="Min IV Rank" value={minRank} suffix="%" onChange={setMinRank} />
      </div>
      <div className="data-table-wrap card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Price</th>
              <th>IV30</th>
              <th>IV Rank</th>
              <th>IV %ile</th>
              <th>HV20</th>
              <th>HV60</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row) => (
              <tr key={row.symbol}>
                <td>
                  <strong>{row.symbol}</strong>
                  <span className="row-sub">{row.name}</span>
                </td>
                <td>${row.stockPrice.toFixed(2)}</td>
                <td>{row.iv30.toFixed(1)}%</td>
                <td className={row.ivRank >= 70 ? 'highlight-cell' : ''}>{row.ivRank}</td>
                <td>{row.ivPercentile}</td>
                <td>{row.hv20.toFixed(1)}%</td>
                <td>{row.hv60.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IncomeAnalyzer() {
  const [minYield, setMinYield] = useState('10');
  const [strategy, setStrategy] = useState<'all' | 'cash-secured-put' | 'covered-call'>('all');

  const results = useMemo(
    () =>
      getIncomeOpportunities({
        minYield: Number(minYield) || 0,
        strategy: strategy === 'all' ? undefined : strategy,
        sortBy: 'annualizedYield',
        sortDir: 'desc',
      }),
    [minYield, strategy],
  );

  return (
    <div className="tool-content">
      <div className="filter-bar card">
        <label className="select-label">
          Strategy
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as typeof strategy)}
          >
            <option value="all">All</option>
            <option value="cash-secured-put">Cash-Secured Put</option>
            <option value="covered-call">Covered Call</option>
          </select>
        </label>
        <NumberField label="Min Annualized Yield" value={minYield} suffix="%" onChange={setMinYield} />
      </div>
      <div className="data-table-wrap card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Strategy</th>
              <th>Strike</th>
              <th>Premium</th>
              <th>Ann. Yield</th>
              <th>POP</th>
              <th>Breakeven</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row) => (
              <tr key={`${row.symbol}-${row.strategy}`}>
                <td>
                  <strong>{row.symbol}</strong>
                </td>
                <td>{row.strategy === 'cash-secured-put' ? 'CSP' : 'CC'}</td>
                <td>${row.strike.toFixed(2)}</td>
                <td>${row.premium.toFixed(2)}</td>
                <td className="highlight-cell">{row.annualizedYield.toFixed(1)}%</td>
                <td>{row.probabilityOfProfit.toFixed(0)}%</td>
                <td>${row.breakeven.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RollAnalyzer() {
  const [stockPrice, setStockPrice] = useState('100');
  const [beforePremium, setBeforePremium] = useState('2.5');
  const [afterPremium, setAfterPremium] = useState('1.8');
  const [strike, setStrike] = useState('95');
  const [beforeDte, setBeforeDte] = useState('10');
  const [afterDte, setAfterDte] = useState('37');

  const result = useMemo(() => {
    const leg = {
      type: 'put' as const,
      side: 'short' as const,
      strike: Number(strike) || 95,
      quantity: 1,
      ivPercent: 30,
    };

    return computeRollAnalyzer({
      stockPrice: Number(stockPrice) || 100,
      riskFreeRate: 4.5,
      dividendYield: 0,
      before: {
        optionLegs: [{ ...leg, premium: Number(beforePremium) || 2.5, dte: Number(beforeDte) || 10 }],
        stockLegs: [],
      },
      after: {
        optionLegs: [{ ...leg, premium: Number(afterPremium) || 1.8, dte: Number(afterDte) || 37 }],
        stockLegs: [],
      },
    });
  }, [stockPrice, beforePremium, afterPremium, strike, beforeDte, afterDte]);

  return (
    <div className="calc-layout">
      <section className="form-panel card">
        <h2 className="panel-title">Roll Parameters</h2>
        <div className="field-grid">
          <NumberField label="Stock Price" value={stockPrice} suffix="$" onChange={setStockPrice} />
          <NumberField label="Strike" value={strike} suffix="$" onChange={setStrike} />
          <NumberField label="Before Premium" value={beforePremium} suffix="$" onChange={setBeforePremium} />
          <NumberField label="Before DTE" value={beforeDte} onChange={setBeforeDte} />
          <NumberField label="After Premium" value={afterPremium} suffix="$" onChange={setAfterPremium} />
          <NumberField label="After DTE" value={afterDte} onChange={setAfterDte} />
        </div>
        <div className="roll-credit card">
          <span className="metric-label">Net Roll Credit</span>
          <span className={`metric-value ${result.netRollCredit >= 0 ? 'profit' : 'loss'}`}>
            ${result.netRollCredit.toFixed(2)}
          </span>
        </div>
      </section>

      <div className="results-column">
        <section className="chart-panel card">
          <h2 className="panel-title">Before vs After P/L</h2>
          <MultiPnLChart
            series={[
              { label: 'Before', data: result.beforeCurve, color: '#94a3b8' },
              { label: 'After', data: result.afterCurve, color: '#55cfff' },
            ]}
            currentPrice={Number(stockPrice)}
          />
        </section>
      </div>
    </div>
  );
}

function TradeLogger() {
  const [trades, setTrades] = useState(DEMO_TRADES);
  const summary = useMemo(() => summarizeTrades(trades), [trades]);

  const closeTrade = (tradeId: string) => {
    setTrades((prev) =>
      prev.map((trade) =>
        trade.id === tradeId && trade.status === 'open'
          ? {
              ...trade,
              status: 'closed' as const,
              closedAt: new Date().toISOString().slice(0, 10),
              exitPremium: Number((trade.entryPremium * 0.2).toFixed(2)),
            }
          : trade,
      ),
    );
  };

  return (
    <div className="tool-content">
      <div className="summary-grid">
        <div className="summary-card card">
          <span className="metric-label">Open Trades</span>
          <span className="metric-value">{summary.openCount}</span>
        </div>
        <div className="summary-card card">
          <span className="metric-label">Closed Trades</span>
          <span className="metric-value">{summary.closedCount}</span>
        </div>
        <div className="summary-card card">
          <span className="metric-label">Realized P/L</span>
          <span className={`metric-value ${summary.realizedPnl >= 0 ? 'profit' : 'loss'}`}>
            ${summary.realizedPnl.toFixed(2)}
          </span>
        </div>
        <div className="summary-card card">
          <span className="metric-label">Open Premium</span>
          <span className="metric-value">${summary.openPremiumCollected.toFixed(2)}</span>
        </div>
      </div>

      <div className="data-table-wrap card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Strategy</th>
              <th>Status</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>P/L</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {summary.trades.map((trade) => {
              const pnl =
                trade.status === 'closed' && trade.exitPremium != null
                  ? (trade.entryPremium - trade.exitPremium) * trade.quantity * 100
                  : null;
              return (
                <tr key={trade.id}>
                  <td>
                    <strong>{trade.symbol}</strong>
                  </td>
                  <td>{trade.strategy}</td>
                  <td>
                    <span className={`status-badge status-${trade.status}`}>{trade.status}</span>
                  </td>
                  <td>${trade.entryPremium.toFixed(2)}</td>
                  <td>{trade.exitPremium != null ? `$${trade.exitPremium.toFixed(2)}` : '—'}</td>
                  <td className={pnl != null ? (pnl >= 0 ? 'profit' : 'loss') : ''}>
                    {pnl != null ? `$${pnl.toFixed(2)}` : '—'}
                  </td>
                  <td>
                    {trade.status === 'open' ? (
                      <button type="button" className="btn-small" onClick={() => closeTrade(trade.id)}>
                        Close
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
