import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Run against Vite preview or the production Docker container.
const base = process.env.PORTFOLIO_PREVIEW_URL || 'http://127.0.0.1:4173';
const files = ['cover', 'request-editor', 'response-viewer', 'import', 'environment'];
const labels = ['Overview', 'Request Editor', 'Response Viewer', 'cURL Import', 'Environment'];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const file of files) {
    const path = `/images/projects/bifrost/${file}.webp`;
    assert.deepEqual(readFileSync(`dist${path}`), readFileSync(`public${path}`));
    const response = await page.request.get(`${base}${path}`);
    assert.equal(response.status(), 200);
    assert.match(response.headers()['content-type'], /image\/webp/);
    assert.deepEqual(await response.body(), readFileSync(`public${path}`));
  }
  await page.goto(base);
  assert.equal(await page.locator('.project-bifrost .project-image img').getAttribute('src'), '/images/projects/bifrost/cover.webp');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal((await page.goto(`${base}/projects/bifrost`)).status(), 200);
    const hero = page.locator('.project-image-hero img');
    assert.equal(await hero.getAttribute('src'), '/images/projects/bifrost/cover.webp');
    assert.equal(await hero.getAttribute('fetchpriority'), 'high');
    const images = page.locator('.screenshot-gallery img');
    assert.equal(await images.count(), 5);
    for (let i = 0; i < files.length; i++) {
      const image = images.nth(i);
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(img => img.decode());
      assert.equal(await image.getAttribute('src'), `/images/projects/bifrost/${files[i]}.webp`);
      assert.ok((await image.getAttribute('alt')).length > 30);
      assert.ok((await page.locator('.screenshot-gallery figcaption').nth(i).innerText()).startsWith(labels[i]));
      assert.equal(await image.getAttribute('loading'), 'lazy');
      assert.ok(await image.evaluate(img => Math.abs(img.clientWidth / img.clientHeight - img.naturalWidth / img.naturalHeight) < 0.02));
      const trigger = page.locator('.screenshot-trigger').nth(i);
      await trigger.click();
      const dialog = page.getByRole('dialog');
      assert.ok(await dialog.isVisible());
      assert.equal(await dialog.locator('img').getAttribute('src'), await image.getAttribute('src'));
      const popupPromise = page.waitForEvent('popup');
      await dialog.getByRole('link', { name: 'Open full-resolution image', exact: false }).click();
      const popup = await popupPromise;
      await popup.waitForLoadState();
      assert.equal(new URL(popup.url()).pathname, await image.getAttribute('src'));
      await popup.close();
      await page.keyboard.press('ArrowRight');
      assert.equal(await dialog.locator('img').getAttribute('src'), `/images/projects/bifrost/${files[(i + 1) % 5]}.webp`);
      await page.keyboard.press('Escape');
      assert.equal(await dialog.isVisible(), false);
      assert.ok(await trigger.evaluate(el => el === document.activeElement));
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `/tmp/bifrost-production-${width}.png`, fullPage: true });
  }
  assert.deepEqual(errors, []);
  console.log('Bifrost passed: all five production assets match originals; desktop/mobile hero, gallery order, aspect ratios, full-resolution links, keyboard navigation and focus restoration.');
} finally {
  await browser.close();
}
