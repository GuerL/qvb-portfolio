import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.PORTFOLIO_PREVIEW_URL || 'http://127.0.0.1:5173';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
// Exercise optional media/actions with explicit test fixtures; nothing is written to product content.
await page.route('**/src/data/portfolio.ts',async route=>{
  const response=await route.fetch();
  const body=await response.text();
  const setup=`projects[0].screenshots = [
    {src:'/images/projects/bifrost/fixture-b.webp',alt:'Second test image',caption:'Second caption',order:2,width:1200,height:630},
    {src:'/images/projects/bifrost/fixture-a.webp',alt:'First test image',caption:'First caption',order:1,width:1200,height:630}
  ]; projects[0].thumbnail = projects[0].screenshots[1];
  projects[0].downloadUrl='https://example.com/download'; projects[0].githubUrl='https://example.com/repo'; projects[0].websiteUrl='https://example.com/product';
  projects[0].release={version:'test-only',platforms:['Test platform']};
  projects[1].liveUrl='https://example.com/scopa'; projects[2].liveUrl='https://example.com/peaks';`;
  assert.ok(body.includes('export const skillGroups'));
  await route.fulfill({response,body:body.replace('export const skillGroups',setup+'\nexport const skillGroups')});
});
await page.route('**/images/projects/bifrost/fixture-*.webp',route=>route.fulfill({contentType:'image/png',body:readFileSync('public/og.png')}));
await page.goto(base);
await page.locator('.project-card').first().waitFor();
assert.equal(await page.locator('.project-action-area').count(),5);
assert.equal(await page.getByRole('link',{name:'Play Now'}).count(),2);
assert.equal(await page.locator('.project-family .project-actions a').count(),0);
for(const link of await page.locator('.project-actions a').all()){
  assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
  assert.match(await link.getAttribute('href'),/^https:\/\//);
}
await page.context().route('https://example.com/**',route=>route.fulfill({contentType:'text/plain',body:'Browser-only destination fixture'}));
const originalUrl=page.url();
const popupPromise=page.waitForEvent('popup');
await page.locator('.project-scopa').getByRole('link',{name:'Play Now'}).click();
const popup=await popupPromise;await popup.waitForLoadState();
assert.equal(popup.url(),'https://example.com/scopa');assert.equal(page.url(),originalUrl);await popup.close();
await page.goto(`${base}/projects/bifrost`);
await page.getByText('Version test-only').waitFor();
assert.equal(await page.locator('.project-image-hero img').getAttribute('alt'),'First test image');
const first=page.getByRole('button',{name:'Expand Bifrost screenshot 1: First test image'});
await first.click();
const dialog=page.getByRole('dialog');await dialog.waitFor();
assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Close screenshot viewer');
await page.keyboard.press('ArrowRight');assert.equal(await dialog.locator('img').getAttribute('alt'),'Second test image');
await page.getByRole('button',{name:'Previous screenshot'}).click();assert.equal(await dialog.locator('img').getAttribute('alt'),'First test image');
await page.keyboard.press('Tab');assert.ok(await dialog.evaluate(el=>el.contains(document.activeElement)));
await page.keyboard.press('Escape');assert.equal(await dialog.isVisible(),false);assert.ok(await first.evaluate(el=>el===document.activeElement));
await first.click();await page.getByRole('button',{name:'Close screenshot viewer'}).click();assert.ok(await first.evaluate(el=>el===document.activeElement));
for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await first.click();assert.ok(await dialog.isVisible());await page.keyboard.press('Escape');
  for(const image of await page.locator('.screenshot-gallery img, .project-image-hero img').all())assert.ok(await image.evaluate(el=>el.complete&&el.naturalWidth>0));
}
await page.screenshot({path:'/tmp/portfolio-bifrost-gallery-mobile.png',fullPage:true});
assert.deepEqual(errors,[]);
await browser.close();console.log('CTA variants, image loading, ordered gallery, focus containment/restoration, Escape, arrows, close button, mobile/tablet/desktop: passed.');
