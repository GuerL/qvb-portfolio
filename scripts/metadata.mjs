import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { build } from 'vite';

// Compile the existing React tree for build-time rendering. No runtime server or browser.
const temporary = '.seo-build';
try {
  await build({ build: { ssr: 'src/entry-server.tsx', outDir: temporary, emptyOutDir: true } });
  const { render, metadata, metaEntries, indexableRoutes, serializeJsonLd, site } = await import(`../${temporary}/entry-server.js`);
  const template = readFileSync('dist/index.html', 'utf8');
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  for (const path of [...indexableRoutes, '/projects', '/404']) {
    const seo = metadata(path);
    const head = `<title>${escape(seo.title)}</title><link rel="canonical" href="${escape(seo.canonical)}"/>`
      + metaEntries(seo).map(([attribute, key, value]) => `<meta ${attribute}="${key}" content="${escape(value)}"/>`).join('')
      + `<script id="seo-jsonld" type="application/ld+json">${serializeJsonLd(seo.jsonLd)}</script>`;
    const html = template.replace(/<title>.*?<\/title>/, '').replace(/<meta name="description"[^>]*>/, '')
      .replace('</head>', `${head}</head>`).replace('<div id="root"></div>', `<div id="root">${render(path)}</div>`);
    const file = path === '/404' ? 'dist/404.html' : `dist${path === '/' ? '' : path}/index.html`;
    mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true });
    writeFileSync(file, html);
  }
  writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site.origin}/sitemap.xml\n`);
  writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexableRoutes.map(path => `  <url><loc>${site.origin}${path}</loc></url>`).join('\n')}\n</urlset>\n`);
} finally { rmSync(temporary, { recursive: true, force: true }); }
