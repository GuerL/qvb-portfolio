export async function demoReady(page) {
  try {
    await page.locator('#root[data-screenshot-ready="true"]').waitFor({ state: 'visible' });
  } catch (error) {
    throw new Error(`Demo readiness was not reached at ${page.url()}. Start this frontend with npm run dev:screenshots (Vite screenshots mode). ${error.message}`);
  }
}

export async function resourcesReady(page, viewport) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    if ([...document.fonts].some(font => font.status === 'error')) throw new Error('A declared font did not load');
    await Promise.all([...document.images].map(async image => {
      await image.decode();
      if (!image.naturalWidth) throw new Error(`Image failed: ${image.src}`);
    }));
    const urls = new Set();
    for (const element of document.querySelectorAll('*')) {
      for (const pseudo of [null, '::before', '::after']) {
        const background = getComputedStyle(element, pseudo).backgroundImage;
        for (const match of background.matchAll(/url\(["']?(.*?)["']?\)/g)) urls.add(match[1]);
      }
    }
    await Promise.all([...urls].map(src => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = () => reject(new Error(`Background image failed: ${src}`));
      image.src = src;
    })));
  });
  const geometry = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, overflow: document.documentElement.scrollWidth > innerWidth }));
  if (geometry.width !== viewport.width || geometry.height !== viewport.height) throw new Error('Viewport does not match configured scene');
  if (geometry.overflow) throw new Error('Horizontal overflow in configured viewport');
}
