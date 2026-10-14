import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  const base = process.env.PORTFOLIO_PREVIEW_URL || 'http://127.0.0.1:5173';
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base);
    for (const [id, label] of [['scopa', 'Play Now'], ['peaks', 'Play Now'], ['bifrost', 'Download']]) {
      const card = page.locator(`.project-${id}`);
      const button = card.getByRole('button', { name: label, exact: true });
      await button.scrollIntoViewIfNeeded();
      assert.ok(await button.isVisible());
      assert.ok(await button.isDisabled());
      const noteId = await button.getAttribute('aria-describedby');
      assert.match(await page.locator(`[id="${noteId}"]`).textContent(), /URL needs to be configured/);
      assert.equal(await card.locator('.project-actions a').count(), 0);
      await card.screenshot({ path: `/tmp/portfolio-action-${id}-${width}.png` });
    }
    assert.equal(await page.locator('.project-action-area').count(), 5);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const [slug, label] of [['scopa-online', 'Play Now'], ['whateverpeaks', 'Play Now'], ['bifrost', 'Download']]) {
      await page.goto(`${base}/projects/${slug}`);
      const button = page.locator('.detail-heading').getByRole('button', { name: label, exact: true });
      await button.waitFor();
      assert.ok(await button.isVisible());
      assert.ok(await button.isDisabled());
    }
  }
  console.log('Actual unconfigured cards/details: visible disabled actions, explanatory text, no fake links, desktop/mobile passed.');
} finally { await browser.close(); }
