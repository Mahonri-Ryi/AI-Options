#!/usr/bin/env node
/**
 * Capture calculator page screenshots for manual side-by-side review.
 * Usage: node scripts/capture-calculator-screenshots.mjs [baseUrl]
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const core = await import(join(root, 'packages/options-core/dist/index.js'));
const { STRATEGIES } = core;

const baseUrl = process.argv[2] ?? 'http://localhost:5173';
const outDir = join(root, 'artifacts/visual-qa/screenshots');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

console.log(`Capturing ${STRATEGIES.length} calculators from ${baseUrl}`);

for (const { id } of STRATEGIES) {
  const url = `${baseUrl}/calculator/${id}`;
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(500);
    const path = join(outDir, `${id}.png`);
    await page.screenshot({ path, fullPage: true });
    console.log(`  ✓ ${id}`);
  } catch (err) {
    console.error(`  ✗ ${id}: ${err.message}`);
  }
}

await browser.close();
console.log(`\nScreenshots saved to ${outDir}`);
