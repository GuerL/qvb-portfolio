import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { indexableRoutes, metadata, metaEntries } from '../src/data/seo.ts';
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || (process.env.CI ? undefined : 'chrome'), headless: true });
try {
  // Validate actual build artifacts without executing the application JavaScript.
  const crawler = await browser.newContext({ javaScriptEnabled: false });
  const page = await crawler.newPage();
  const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
  assert.deepEqual(await page.evaluate(xml => {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('Invalid sitemap XML');
    return [...doc.querySelectorAll('loc')].map(node => node.textContent);
  }, sitemap), indexableRoutes.map(path => `https://qvb.dev${path}`));
  assert.equal(readFileSync('dist/robots.txt', 'utf8'), 'User-agent: *\nAllow: /\n\nSitemap: https://qvb.dev/sitemap.xml\n');
  for (const path of [...indexableRoutes, '/projects', '/404']) {
    const file = path === '/404' ? 'dist/404.html' : `dist${path === '/' ? '' : path}/index.html`;
    await page.setContent(readFileSync(file, 'utf8'));
    const expected = metadata(path);
    assert.equal(await page.title(), expected.title);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('main').count(), 1);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), expected.canonical);
    for (const [attribute, key, content] of metaEntries(expected)) {
      const tag = page.locator(`meta[${attribute}="${key}"]`);
      assert.equal(await tag.count(), 1);
      assert.equal(await tag.getAttribute('content'), content);
    }
    assert.deepEqual(JSON.parse(await page.locator('#seo-jsonld').textContent()), expected.jsonLd);
    assert.ok((await page.locator('main').innerText()).length > 100);
  }
  await crawler.close();
  const base = process.env.PORTFOLIO_PREVIEW_URL || 'http://127.0.0.1:4173';
  const live = await browser.newPage();
  live.setDefaultTimeout(10000);
  const errors = [];
  live.on('pageerror', error => errors.push(error.message));
  live.on('console', message => { if (message.type() === 'error' && !message.text().includes('the server responded with a status of 404')) errors.push(message.text()); });
  for (const path of indexableRoutes) {
    const response = await live.goto(`${base}${path}`);
    assert.equal(response.status(), 200);
    await live.locator('h1').waitFor();
    assert.equal(await live.title(), metadata(path).title);
    await live.waitForTimeout(100);
  }
  for (const [path, type] of [['/robots.txt', /text\/plain/], ['/sitemap.xml', /(?:application|text)\/xml/], ['/og.png', /image\/png/], ['/favicon.svg', /image\/svg\+xml/]]) {
    const response = await live.request.get(`${base}${path}`);
    assert.equal(response.status(), 200);
    assert.match(response.headers()['content-type'], type);
  }
  if (process.env.CHECK_HTTP_404) {
    const response = await live.goto(`${base}/does-not-exist`);
    assert.equal(response.status(), 404);
    assert.equal(await live.locator('meta[name="robots"]').getAttribute('content'), 'noindex, follow');
  }
  // Compare hydrated and no-JS renderings, with animation frozen at the same frame.
  for (const width of [1440, 390]) {
    const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } });
    const staticPage = await staticContext.newPage();
    await live.setViewportSize({ width, height: 900 });
    const freeze = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';
    const freezeCss = async route => { const response = await route.fetch(); await route.fulfill({ response, body: await response.text() + freeze }); };
    await staticPage.route('**/*.css', freezeCss);
    await live.route('**/*.css', freezeCss);
    for (const path of ['/', '/projects/bifrost']) {
      await staticPage.goto(`${base}${path}`);
      await live.goto(`${base}${path}`);
      assert.deepEqual(await live.screenshot({ fullPage: true }), await staticPage.screenshot({ fullPage: true }), `Hydration changed appearance: ${path} at ${width}`);
    }
    await staticContext.close();
  }
  assert.deepEqual(errors, []);
  console.log('SEO passed: build HTML without JS, sitemap XML, all metadata, JSON-LD, direct routes, assets, hydration, and desktop/mobile visual parity.');
} finally { await browser.close(); }
