import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch(process.env.CI ? {} : { channel: 'chrome' });
const base = process.env.PORTFOLIO_PREVIEW_URL || 'http://127.0.0.1:4173';
const changedVersion = '00000000-0000-4000-8000-000000000000';
try {
  for (const scenario of ['reload', 'editing', 'focused', 'dialog', 'offline']) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.clock.install();
    let changed = false;
    let requests = 0;
    let navigations = 0;
    page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
    await page.route('**/version.json', async route => {
      requests++;
      if (!changed) return route.fulfill({ response: await route.fetch() });
      if (scenario === 'offline') return route.abort();
      await route.fulfill({ json: { version: changedVersion } });
    });
    await page.goto(base);
    await expect.poll(() => requests).toBe(1);
    assert.equal(navigations, 1);
    changed = true;
    if (scenario === 'editing' || scenario === 'focused') {
      await page.evaluate(() => {
        const input = document.createElement('input');
        document.body.append(input);
        input.focus();
      });
      if (scenario === 'editing') {
        await page.locator('input').fill('Keep this draft');
        await page.locator('input').blur();
      }
    }
    if (scenario === 'dialog') await page.evaluate(() => {
      const dialog = document.createElement('dialog');
      document.body.append(dialog);
      dialog.showModal();
    });
    await page.clock.fastForward(31_000);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    if (scenario === 'reload') {
      await expect.poll(() => navigations).toBe(2);
      await page.waitForLoadState();
      await page.clock.fastForward(31_000);
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await expect.poll(() => requests).toBeGreaterThanOrEqual(3);
    } else if (scenario === 'offline') {
      await expect.poll(() => requests).toBe(2);
    }
    // Give the fetch/reload task time to complete before checking protection.
    await page.waitForTimeout(250);
    assert.equal(navigations, scenario === 'reload' ? 2 : 1, scenario);
    await context.close();
  }
  console.log('Deployment detection: normal reload, loop protection, forms, focus, dialog and offline checks passed.');
} finally {
  await browser.close();
}
