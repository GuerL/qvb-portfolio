import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { selectScenes } from './config.mjs';
import { validateWebp } from './images.mjs';

async function main() {
  const scenes = selectScenes();
  // Invalidate selected old previews before starting: failed runs cannot publish stale files.
  for (const scene of scenes) await rm(scene.preview, { force: true });
  const failures = [];
  let browser;
  try {
    for (const scene of scenes) {
      let context;
      const url = new URL(scene.path, `${scene.url.replace(/\/$/, '')}/`).href;
      try {
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
          await response.body?.cancel();
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
        } catch (error) {
          throw new Error(`Application unavailable at ${url}. Start its frontend/backend, or set ${scene.env} to a reachable local instance. ${error.message}`);
        }
        browser ??= await chromium.launch({ headless: true, ...(process.env.SCREENSHOTS_BROWSER_CHANNEL ? { channel: process.env.SCREENSHOTS_BROWSER_CHANNEL } : {}) });
        context = await browser.newContext({ viewport: scene.viewport, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', colorScheme: 'dark', reducedMotion: 'reduce' });
        const page = await context.newPage();
        page.setDefaultTimeout(15000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('requestfailed', request => errors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
        page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
        const response = await page.goto(url, { waitUntil: 'load' });
        if (!response?.ok()) throw new Error(`Navigation failed: ${response?.status()}`);
        // Strategies may create additional contexts/pages for Phase 2 and register cleanup with try/finally.
        await scene.capture({ page, context, browser, scene });
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].map(async image => {
            await image.decode();
            if (!image.naturalWidth) throw new Error(`Image failed: ${image.src}`);
          }));
        });
        const fitsViewport = await page.evaluate(() => {
          const documentElement = document.documentElement;
          return documentElement.scrollWidth <= innerWidth && documentElement.scrollHeight <= innerHeight;
        });
        if (!fitsViewport) throw new Error('Interface overflows the fixed viewport. Check responsive layout before capture; images are never resized to fit.');
        const visibleErrors = page.locator('[role="alert"], vite-error-overlay, .toast, .error');
        for (const element of await visibleErrors.all()) {
          if (await element.isVisible()) throw new Error(`Visible application error: ${await element.textContent()}`);
        }
        if (errors.length) throw new Error(errors.join('\n'));
        // PNG is Playwright's lossless intermediate; sharp encodes WebP without resizing.
        const png = await page.screenshot({ type: 'png', fullPage: false, animations: 'disabled', caret: 'hide' });
        if (errors.length) throw new Error(errors.join('\n'));
        const webp = await sharp(png).webp({ quality: 90 }).toBuffer();
        await validateWebp(webp, scene.viewport);
        await mkdir(dirname(scene.preview), { recursive: true });
        await writeFile(`${scene.preview}.tmp`, webp);
        await rename(`${scene.preview}.tmp`, scene.preview);
        console.log(`Captured ${scene.project}/${scene.id}: ${scene.preview}`);
      } catch (error) {
        failures.push(`${scene.project}/${scene.id}: ${error.message}`);
      } finally {
        await context?.close();
      }
    }
  } finally {
    await browser?.close();
  }
  if (failures.length) throw new Error(failures.join('\n'));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
