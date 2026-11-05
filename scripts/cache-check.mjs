import assert from 'node:assert/strict';

const base = process.env.PORTFOLIO_PREVIEW_URL || 'http://127.0.0.1:18080';
const revalidate = 'no-cache, must-revalidate';
for (const path of ['/', '/index.html', '/projects', '/projects/gryd', '/projects/bifrost', '/version.json', '/robots.txt', '/sitemap.xml']) {
  const response = await fetch(new URL(path, base), { method: 'HEAD' });
  assert.equal(response.status, 200, path);
  assert.equal(response.headers.get('cache-control'), revalidate, path);
}
const html = await (await fetch(base)).text();
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^" ]+\.(?:js|css))"/g)].map(match => match[1]);
assert.ok(assets.length >= 2);
for (const path of assets) {
  const response = await fetch(new URL(path, base), { method: 'HEAD' });
  assert.equal(response.status, 200, path);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=31536000, immutable', path);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
}
for (const path of ['/missing', '/assets/missing-12345678.js', '/missing.js', '/images/missing.webp']) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 404, path);
  assert.equal(response.headers.get('cache-control'), revalidate, path);
}
// Even same-sized HTML builds within one second must not validate stale HTML.
const conditional = await fetch(base, { headers: { 'If-Modified-Since': new Date(Date.now() + 86400000).toUTCString() } });
assert.equal(conditional.status, 200);
console.log('HTML, metadata, assets, conditional requests and missing-resource cache policies passed.');
