const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const esbuild = require('esbuild');
const { chromium } = require('playwright');

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dyno-forge-smoke-'));
  esbuild.buildSync({
    stdin: {
      contents: "import React from 'react'; import {createRoot} from 'react-dom/client'; import App from './App.jsx'; createRoot(document.getElementById('root')).render(<App/>);",
      resolveDir: path.resolve(__dirname, '..'), loader: 'jsx',
    },
    bundle: true,
    nodePaths: (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean),
    outfile: path.join(dir, 'app.js'),
  });
  fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0}*{box-sizing:border-box}</style></head><body><div id="root"></div><script src="/app.js"></script></body></html>');
  const server = http.createServer((req, res) => {
    const isScript = req.url === '/app.js';
    res.setHeader('Content-Type', isScript ? 'text/javascript' : 'text/html');
    res.end(fs.readFileSync(path.join(dir, isScript ? 'app.js' : 'index.html')));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    for (const width of [1440, 390]) {
      const browser = await chromium.launch({
        headless: true,
        ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}),
        args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
      });
      try {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`http://127.0.0.1:${server.address().port}`);
        await page.getByRole('button', { name: 'Select 6.2L Aluminum Block (LS3)', exact: true }).waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal overflow');
        const block = page.getByRole('button', { name: 'Select 6.0L Iron Block (LQ4)', exact: true });
        await block.focus();
        await page.keyboard.press('Enter');
        assert.equal(await block.getAttribute('aria-pressed'), 'true');
        for (const name of ['COYOTE 5.0', 'BIG BLOCK', 'HEMI V8', 'SMALL BLOCK', 'LS SERIES']) {
          await page.getByRole('button', { name, exact: true }).click();
        }
        await page.getByRole('textbox', { name: 'Build name' }).fill('Smoke test build');
        await page.getByRole('button', { name: '+ SAVE BUILD', exact: true }).click();
        await page.getByText('Saved (1)', { exact: true }).waitFor();
        await page.reload();
        await page.getByText('Saved (1)', { exact: true }).waitFor();
        assert.equal(await page.getByText('Smoke test build', { exact: true }).count(), 1);
        assert.equal(await page.getByText('NaN', { exact: false }).count(), 0);
        await page.getByRole('button', { name: 'LOAD', exact: true }).click();
        assert.equal(await page.getByRole('textbox', { name: 'Build name' }).inputValue(), 'Smoke test build');
        await page.getByRole('button', { name: 'COYOTE 5.0', exact: true }).click();
        const invalid = page.getByRole('button', { name: 'Select 408ci Stroker (4.0" stroke)', exact: true });
        await invalid.click();
        assert.ok(await page.getByText('This block has inconsistent displacement', { exact: false }).count());
        assert.equal(await invalid.locator('..').getByRole('link').count(), 0);
        assert.equal(await page.getByText('Resolve errors first', { exact: true }).count(), 2);
        assert.deepEqual(errors, [], 'No uncaught runtime errors');
        if (process.env.SMOKE_SCREENSHOT_DIR) {
          fs.mkdirSync(process.env.SMOKE_SCREENSHOT_DIR, { recursive: true });
          await page.screenshot({ path: path.join(process.env.SMOKE_SCREENSHOT_DIR, `${width}.png`), fullPage: true });
        }
        console.log(`PASS ${width}px: render, layout, keyboard selection, five engine families, save/reload/load, invalid-build safeguards`);
      } finally {
        await browser.close();
      }
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
