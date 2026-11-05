import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

const origin = 'https://analytics.qvb.dev';
const expected = new Map(Object.entries({
  'default-src': "'self'",
  'script-src': `'self' ${origin}`,
  'style-src': "'self' 'unsafe-inline'",
  'img-src': "'self' https: data:",
  'font-src': "'self'",
  'connect-src': `'self' ${origin}`,
  'object-src': "'none'",
  'base-uri': "'self'",
  'frame-ancestors': "'none'",
  'form-action': "'self'",
}));
function checkPolicy(policy) {
  const directives = policy.split(';').map(value => value.trim()).filter(Boolean).map(value => {
    const [name, ...sources] = value.split(/\s+/);
    return [name, sources.join(' ')];
  });
  assert.equal(directives.length, expected.size, 'No duplicate or additional directives');
  assert.deepEqual(new Map(directives), expected, 'Preserve every restriction and allow only the Umami origin');
}
function checkHtml(html) {
  const scripts = html.match(/<script\b[^>]*\bsrc=["']https:\/\/analytics\.qvb\.dev\/script\.js["'][^>]*>/g) || [];
  assert.equal(scripts.length, 1);
  assert.match(scripts[0], /\bdefer\b/);
  assert.match(scripts[0], /data-website-id="065a0a15-0bde-426c-a35b-097bcd38df78"/);
  assert.match(scripts[0], /data-domains="qvb.dev,www.qvb.dev"/);
  assert.ok(html.indexOf(scripts[0]) < html.indexOf('</head>'));
  assert.doesNotMatch(html, /http-equiv=["']Content-Security-Policy/i);
  assert.doesNotMatch(html, /static\.cloudflareinsights\.com/);
}
test('Docker ships the single Nginx CSP with scoped Umami permissions', () => {
  const config = readFileSync('deploy/nginx.conf', 'utf8');
  assert.equal((config.match(/add_header Content-Security-Policy\b/g) || []).length, 1);
  checkPolicy(config.match(/add_header Content-Security-Policy "([^"]+)" always;/)[1]);
  assert.match(readFileSync('Dockerfile', 'utf8'), /COPY deploy\/nginx.conf \/etc\/nginx\/conf.d\/default.conf/);
});
test('Source includes the deferred Umami integration once in head', () => checkHtml(readFileSync('index.html', 'utf8')));
if (process.env.CHECK_ANALYTICS_BUILD) {
  test('Metadata generation preserves Umami on every generated HTML page', () => {
    const files = readdirSync('dist', { recursive: true }).filter(file => file.endsWith('.html'));
    assert.ok(files.length > 1);
    for (const file of files) checkHtml(readFileSync(`dist/${file}`, 'utf8'));
  });
}
if (process.env.PORTFOLIO_PREVIEW_URL) {
  test('Production HTTP responses carry the expected CSP on routes and errors', async () => {
    for (const path of ['/', '/projects', '/projects/bifrost', '/missing']) {
      const response = await fetch(new URL(path, process.env.PORTFOLIO_PREVIEW_URL));
      assert.equal(response.status, path === '/missing' ? 404 : 200);
      checkPolicy(response.headers.get('content-security-policy') || '');
      checkHtml(await response.text());
    }
  });
}
