# Umami analytics and production CSP

`deploy/nginx.conf` is the single repository CSP source. The Dockerfile copies it
into `/etc/nginx/conf.d/default.conf`; Vite's development/preview servers do not
apply it. The original `script-src 'self'` and `connect-src 'self'` blocked Umami.
Only `https://analytics.qvb.dev` is added to those directives. There is no
`script-src-elem`, nonce, or `strict-dynamic` policy to amend. All other directives
(including the existing inline-style permission) and cache rules are unchanged.

The deferred script in `index.html` remains restricted to `qvb.dev,www.qvb.dev`
and website ID `065a0a15-0bde-426c-a35b-097bcd38df78`. Metadata generation keeps
it once in the head of every generated page, including project routes and 404.
Existing navigation uses page links and fragment links; no React analytics hook
or second tracker is required. Fragment scrolling need not count as a new page.

## Deployment and verification

Rebuild and redeploy only the portfolio service using the existing deployment
procedure (for Compose: `docker compose up -d --build portfolio`). Keep the
Cloudflare Tunnel topology unchanged. No analytics API proxy is required:
browsers connect directly to the analytics origin over HTTPS.

Check the origin response and the public responses after deployment:

```sh
curl -sSI http://127.0.0.1:8085/
curl -sSI https://qvb.dev/
curl -sSIL https://www.qvb.dev/
```

The final HTML response must have one CSP with the analytics origin in both
`script-src` and `connect-src`. On investigation, the public apex header matched
the original Nginx configuration exactly, and www redirected to the apex. This
does not rule out externally managed Cloudflare header rules: if an old or second
policy persists, inspect Cloudflare response-header Transform Rules, Workers and
other edge configuration. Update/remove the stale external policy at its source;
multiple CSP policies are enforced together, so adding another cannot relax one.
If Cloudflare serves stale cached HTML/headers, purge the affected portfolio URLs.
The existing origin policy keeps HTML revalidating and hashed assets immutable.

Automated checks:

```sh
npm test
npm run build
CHECK_ANALYTICS_BUILD=1 node --test scripts/analytics.test.mjs
PORTFOLIO_PREVIEW_URL=http://127.0.0.1:8085 node --test scripts/analytics.test.mjs
```

The last command requires the rebuilt Nginx deployment, not Vite preview. CI also
checks generated HTML and real container responses, including routes and 404.

In Firefox, open Developer Tools before reloading, disable the Network cache,
and check both public hostnames (www currently redirects):

1. In Network, verify `https://analytics.qvb.dev/script.js` returns HTTP 200.
2. Filter for `api/send`; verify the POST to
   `https://analytics.qvb.dev/api/send` receives a successful 2xx response.
3. Check Console for no Umami CSP violations. Follow a project link and return;
   verify tracking still works and no duplicate script is inserted.
4. Open the Umami dashboard for this website and verify a new page view appears.

If requests are blocked by a Firefox tracking protection setting or extension,
use a clean test profile to distinguish that from CSP. Do not loosen the policy.

## Cloudflare Web Analytics

No Cloudflare Web Analytics script or enablement configuration exists in this
repository. A sampled public HTML response also had no `cloudflareinsights`
beacon, so the reported injection cannot be reproduced from that sample. If
Cloudflare injects it for browser requests, disable automatic setup for this site
in Cloudflare's **Web Analytics → Manage site** settings. Alternatively, use a
Configuration Rule scoped to `qvb.dev` and `www.qvb.dev` with **Disable Real User
Monitoring (RUM)** enabled. Leave other sites untouched. Keep Umami as the sole
application analytics integration; do not allowlist the unused beacon.

Cloudflare documents [automatic RUM injection](https://developers.cloudflare.com/speed/observatory/rum-beacon/)
and the [Disable Real User Monitoring setting](https://developers.cloudflare.com/rules/configuration-rules/settings/#disable-real-user-monitoring-rum).
