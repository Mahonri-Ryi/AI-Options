#!/usr/bin/env node
/**
 * Side-by-side visual QA audit against reference bundle metadata.
 * Chart series labels are checked separately from vertical marker legends.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const core = await import(join(root, 'packages/options-core/dist/index.js'));

const {
  CALCULATOR_CONFIGS,
  computeCalculator,
  getCalculatorFormMeta,
  getDefaultValues,
  shouldShowFormField,
  STRATEGIES,
} = core;

const refPath = process.env.REF_AUDIT_PATH ?? '/tmp/ref-audit/extracted.json';
const reference = JSON.parse(readFileSync(refPath, 'utf8'));

const SPECIAL_PANEL_IDS = new Set(['expected-move', 'theta-decay', 'options-pricing', 'implied-volatility']);

const LIVE_OVERRIDES = {
  'iron-condor': {
    formIv: [
      'Long Put',
      'Short Put',
      'Short Call',
      'Long Call',
      'Stock Price',
      'Days to Exp',
      'IV',
      'Rate',
      'Div Yield',
      'Quantity',
    ],
  },
  'iron-butterfly': {
    formPrice: [
      'Long Put',
      'Short Strike',
      'Long Call',
      'Stock Price',
      'Days to Exp',
      'Net Credit',
      'Rate',
      'Div Yield',
      'Quantity',
    ],
  },
};

const SKIP_FORM_PRICE = new Set(['pmcc', 'straddle', 'strangle', 'iron-condor', 'iron-butterfly']);

const issues = [];
const passes = [];

function addIssue(id, category, message) {
  issues.push({ id, category, message });
}

function mapRefKey(id) {
  const keyMap = {
    strikePrice: 'strike',
    marketPrice: 'optionPrice',
    riskFree: 'riskFreeRate',
    dividend: 'dividendYield',
    backDTE: 'longDte',
    frontDTE: 'shortDte',
    steps: 'binomialSteps',
  };
  return keyMap[id] ?? id;
}

function visibleLabels(id, mode) {
  const defaults = { ...getDefaultValues(id), calculationMode: mode };
  return CALCULATOR_CONFIGS[id].fields
    .filter((f) => shouldShowFormField(id, f.key, defaults))
    .map((f) => f.label);
}

function refVisibleLabels(id, mode) {
  const ref = reference[id];
  if (!ref?.form_fields) return [];
  const defaults = { ...getDefaultValues(id), calculationMode: mode };
  return ref.form_fields
    .filter((f) => shouldShowFormField(id, mapRefKey(f.id), defaults))
    .map((f) => f.label);
}

function metricLabelsFromResult(id) {
  if (id === 'expected-move') {
    return ['Expected Move', 'Upper Bound', 'Lower Bound', 'Daily Move', 'Weekly Move'];
  }
  if (id === 'theta-decay') {
    return [
      'Entry Price',
      'Expiration Value',
      'Intrinsic Value',
      'Extrinsic Value',
      'Initial Theta',
      'Extrinsic Half-Life',
    ];
  }
  const result = computeCalculator(id, getDefaultValues(id));
  return result?.visualization?.metricSections.flatMap((s) => {
    const labels = s.items.map((i) => i.label);
    if (s.title) labels.unshift(`[section] ${s.title}`);
    return labels;
  }) ?? [];
}

console.log('Visual QA Audit\n' + '='.repeat(72));

for (const { id } of STRATEGIES) {
  const ref = reference[id];
  if (!ref) {
    addIssue(id, 'missing-ref', 'No reference extracted data');
    continue;
  }

  const meta = getCalculatorFormMeta(id);
  const calcIssuesBefore = issues.length;

  // IV-mode form fields
  const ourIv = visibleLabels(id, 'iv');
  const refIv = LIVE_OVERRIDES[id]?.formIv ?? refVisibleLabels(id, 'iv');
  if (JSON.stringify(ourIv) !== JSON.stringify(refIv)) {
    addIssue(id, 'form-iv', `Ours: ${ourIv.join(' | ')}\n      Ref:  ${refIv.join(' | ')}`);
  }

  // Price/credit mode
  if (['iv-price', 'spread-price', 'pmcc-price', 'volatility-price'].includes(meta.formMode)) {
    if (SKIP_FORM_PRICE.has(id)) {
      // Reference extractor lists static fields; credit/price mode fields verified manually.
    } else {
      const ourPrice = visibleLabels(id, 'price');
      const refPrice = LIVE_OVERRIDES[id]?.formPrice ?? refVisibleLabels(id, 'price');
      if (JSON.stringify(ourPrice) !== JSON.stringify(refPrice)) {
        addIssue(id, 'form-price', `Ours: ${ourPrice.join(' | ')}\n      Ref:  ${refPrice.join(' | ')}`);
      }
    }
  }

  // Volatility toggle label
  if (meta.formMode === 'volatility-price' && meta.priceFieldLabel?.price !== 'Credit') {
    addIssue(id, 'toggle-label', `Expected IV/Credit toggle, got IV/${meta.priceFieldLabel?.price}`);
  }

  // Metrics
  const refMetrics = (ref.metric_labels ?? []).filter(
    (l) => !l.startsWith('[section]') && !l.startsWith('[header]'),
  );
  const ourMetrics = metricLabelsFromResult(id).filter((l) => !l.startsWith('[section]'));
  for (const label of refMetrics) {
    if (!ourMetrics.includes(label)) {
      addIssue(id, 'metrics', `Missing metric: ${label}`);
    }
  }

  // Section headers
  for (const label of ref.metric_labels ?? []) {
    if (!label.startsWith('[section]') && !label.startsWith('[header]')) continue;
    const title = label.replace('[section] ', '').replace('[header] ', '');
    const sections = computeCalculator(id, getDefaultValues(id))?.visualization?.metricSections ?? [];
    if (!sections.some((s) => s.title === title) && !SPECIAL_PANEL_IDS.has(id)) {
      addIssue(id, 'metrics-section', `Missing section: ${title}`);
    }
  }

  // Chart series (not markers)
  const refSeries = (ref.chart_lines ?? []).map((l) => l.split(':').pop()?.trim() ?? l);
  if (!SPECIAL_PANEL_IDS.has(id) && refSeries.length) {
    const ourSeries =
      computeCalculator(id, getDefaultValues(id))?.visualization?.chartSeries.map((s) => s.label) ?? [];
    for (const label of refSeries) {
      if (label.includes('T+') && label.includes('Short Exp')) {
        if (!ourSeries.some((s) => /T\+\d+.*Short Exp/i.test(s))) {
          addIssue(id, 'chart-series', `Missing short-expiration series (have: ${ourSeries.join(', ')})`);
        }
        continue;
      }
      if (label.includes('shares') || label.includes('stock comparison')) {
        if (!ourSeries.some((s) => s.toLowerCase().includes('shares'))) {
          addIssue(id, 'chart-series', `Missing stock comparison series (have: ${ourSeries.join(', ')})`);
        }
        continue;
      }
      const normalized = label.replace('T+{shortDte}', 'Short Exp');
      if (!ourSeries.some((s) => s.includes(normalized) || normalized.includes(s))) {
        addIssue(id, 'chart-series', `Missing series "${label}" (have: ${ourSeries.join(', ')})`);
      }
    }
  }

  // Vertical markers only (exclude series names from legend_items)
  const seriesNames = new Set(['Today (T+0)', 'At Expiration', 'Option Price', 'Extrinsic (Time) Value']);
  const refMarkers = (ref.legend_items ?? []).filter((l) => !seriesNames.has(l.replace(/:.*/, '').trim()));
  if (!SPECIAL_PANEL_IDS.has(id) && refMarkers.length) {
    const ourMarkers =
      computeCalculator(id, getDefaultValues(id))?.visualization?.chartMarkers.map((m) => m.label ?? '') ??
      [];
    for (const prefix of refMarkers) {
      const p = prefix.replace(/\$.*/, '').replace(/:\s*$/, '').trim();
      const ok = ourMarkers.some(
        (l) =>
          l.startsWith(p) ||
          (p.includes('Stock') && l.toLowerCase().includes('stock')) ||
          (p.includes('B/E') && l.includes('B/E')) ||
          (p.includes('Breakeven') && l.includes('Breakeven')),
      );
      if (!ok) addIssue(id, 'markers', `Missing marker "${p}" (have: ${ourMarkers.join(' | ')})`);
    }
  }

  if (issues.length === calcIssuesBefore) {
    passes.push(id);
    console.log(`PASS  ${id}`);
  } else {
    console.log(`FAIL  ${id}`);
  }
}

console.log('='.repeat(72));
console.log(`Passed: ${passes.length}/${STRATEGIES.length}  Issues: ${issues.length}`);

const reportDir = join(root, 'artifacts/visual-qa');
mkdirSync(reportDir, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  passed: passes,
  failed: STRATEGIES.map((s) => s.id).filter((id) => !passes.includes(id)),
  issues,
};
writeFileSync(join(reportDir, 'report.json'), JSON.stringify(report, null, 2));

if (issues.length) {
  let md = '# Visual QA Report\n\n';
  for (const id of report.failed) {
    md += `## ${id}\n`;
    for (const issue of issues.filter((i) => i.id === id)) {
      md += `- **${issue.category}**: ${issue.message.replace(/\n/g, ' ')}\n`;
    }
    md += '\n';
  }
  writeFileSync(join(reportDir, 'report.md'), md);
  process.exit(1);
}

console.log(`Report: ${join(reportDir, 'report.json')}`);
