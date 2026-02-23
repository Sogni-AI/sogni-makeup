#!/usr/bin/env node
/**
 * Captures the OG banner HTML as a 1200x630 PNG using Puppeteer.
 * Usage: node scripts/capture-og-banner.mjs
 * Output: public/og-banner.png
 */
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, 'og-banner-generator.html');
const outputPath = path.resolve(__dirname, '..', 'public', 'og-banner.png');

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

// Wait for fonts to load
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 1500));

const banner = await page.$('#og-banner');
await banner.screenshot({
  path: outputPath,
  type: 'png',
});

console.log(`OG banner saved to: ${outputPath}`);

await browser.close();
