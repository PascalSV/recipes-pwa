import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const size = Number(process.argv[2] ?? 512);
const svg = readFileSync(join(root, 'worker/static/icons/cookbook.svg'), 'utf8');
const out = process.argv[3] ?? join(root, 'worker/static/icons/cookbook.png');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
await page.setContent(
  `<!doctype html><html><head><style>html,body{margin:0;padding:0;width:${size}px;height:${size}px}svg{display:block}</style></head><body>${svg}</body></html>`,
  { waitUntil: 'networkidle' }
);
await page.waitForTimeout(100);
const el = page.locator('svg');
await el.screenshot({ path: out, type: 'png' });
await browser.close();
console.log('rendered', out);
