import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const base = process.env.PORTFOLIO_PREVIEW_URL || 'http://127.0.0.1:4173';
  const destinations = [
    ['LinkedIn', 'https://www.linkedin.com/in/quentin-van-bever/'],
    ['GitHub', 'https://github.com/GuerL'],
    ['Email', 'mailto:vbquentin@gmail.com'],
  ];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/projects', '/projects/bifrost', '/projects/scopa-online', '/projects/whateverpeaks', '/projects/familylist', '/projects/echocue']) {
      await page.goto(`${base}${route}`);
      if (width < 700) await page.getByRole('button', { name: 'Open navigation' }).click();
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Let’s connect' }).click();
      await page.waitForURL(`${base}/#contact`);
      await page.waitForFunction(() => {
        const rect = document.getElementById('contact')?.getBoundingClientRect();
        return rect && rect.top >= -1 && rect.bottom <= innerHeight + 1;
      });
      for (const [label, href] of destinations) {
        for (const scope of [page.locator('#contact'), page.getByRole('navigation', { name: 'Social links' })]) {
          const link = scope.getByRole('link', { name: new RegExp(label) });
          assert.equal(await link.getAttribute('href'), href);
          assert.ok(await link.isVisible());
          if (!href.startsWith('mailto:')) {
            assert.equal(await link.getAttribute('target'), '_blank');
            assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
          } else assert.equal(await link.getAttribute('target'), null);
          await link.focus();
          assert.ok(await link.evaluate(el => el === document.activeElement));
        }
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await page.locator('#contact').screenshot({ path: `/tmp/portfolio-contact-${width}.png` });
    await page.locator('footer').screenshot({ path: `/tmp/portfolio-footer-${width}.png` });
  }
  assert.deepEqual(errors, []);
  console.log('Contact navigation from home, listing, and all project routes; social destinations; mailto; keyboard access; desktop/mobile layout: passed.');
} finally { await browser.close(); }
