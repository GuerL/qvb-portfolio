import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  for (const width of [1440, 1100, 1024, 768, 700, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(process.env.PORTFOLIO_PREVIEW_URL || 'http://127.0.0.1:5173');
    const cards = page.locator('.project-card');
    await cards.first().waitFor();
    assert.equal(await cards.count(), 6);
    assert.deepEqual(await cards.locator('h3').allTextContents(), ['Bifrost', 'GRYD', 'Scopa Online', 'WhateverPeaks', 'FamilyList', 'EchoCue']);
    const boxes = await cards.evaluateAll(elements => elements.map(el => {
      const { x, y, width, height } = el.getBoundingClientRect();
      return { x, y, width, height };
    }));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
    if (width >= 1100) {
      assert.equal(boxes[1].y, boxes[2].y);
      assert.equal(boxes[3].y, boxes[4].y);
      assert.equal(boxes[4].y, boxes[5].y);
      assert.ok(boxes[0].width > boxes[1].width && boxes[1].width > boxes[3].width);
      assert.ok(boxes[1].y >= boxes[0].y + boxes[0].height);
      assert.ok(boxes[3].y >= boxes[1].y + boxes[1].height);
    } else if (width > 700) {
      assert.equal(boxes[1].y, boxes[2].y);
      assert.equal(boxes[3].y, boxes[4].y);
    } else {
      for (let i = 1; i < boxes.length; i++) {
        assert.equal(boxes[i].x, boxes[0].x);
        assert.ok(boxes[i].y >= boxes[i - 1].y + boxes[i - 1].height);
      }
    }
    assert.equal(await page.locator('.project-gryd .project-actions a').count(), 0);
    for (const image of await cards.locator('img').all()) {
      assert.equal(await image.evaluate(el => getComputedStyle(el).objectFit), 'contain');
    }
    if (width === 1440) await page.locator('#projects').screenshot({ path: '/tmp/portfolio-projects-desktop.png' });
    await page.getByRole('link', { name: 'Explore GRYD', exact: true }).click();
    await page.getByRole('heading', { name: 'GRYD.', exact: true }).waitFor();
    await page.getByRole('link', { name: 'All projects', exact: true }).click();
    await page.locator('#projects').waitFor();
    await page.getByRole('button', { name: 'Web applications' }).click();
    assert.equal(await cards.count(), 3);
    await page.getByRole('button', { name: 'Desktop tools' }).click();
    assert.equal(await cards.count(), 2);
  }
  console.log('Six unique projects, desktop 1/2/3, tablet/mobile layouts, overflow, media containment, filters and GRYD navigation: passed.');
} finally {
  await browser.close();
}
