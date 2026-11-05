# Deployment caching

The Docker build workflow is unchanged. Rebuild and replace the portfolio service
using the commands in the root README. No service worker is registered.

Nginx sends `Cache-Control: no-cache, must-revalidate` for HTML, generated project
routes, the custom 404 page, `version.json`, and unversioned public resources.
Successful Vite content-hashed `/assets/` responses get
`public, max-age=31536000, immutable`. Missing files return 404 and never receive
immutable caching. Security headers remain inherited by every location.

The existing architecture generates route HTML at build time and uses normal
anchor navigation. Known routes, including `/projects`, keep their generated
HTML; unknown routes keep the custom HTTP 404 rather than an index fallback.
Any HTML served by the generic location uses the same revalidation policy.
Vite's asset hashing is unchanged. Do not place unversioned files in `public/assets/`
with names that imitate Vite's `name-<hash>.extension` convention.

Nginx's mtime/size ETags and conditional modification responses are disabled to
avoid false 304s for same-size HTML generated in the same second. Immutable assets
still require no network requests while fresh. Unversioned files are fetched
again on use, so replacing an image at the same URL also becomes visible.

Each production build embeds a UUID in the client and writes the matching
`/version.json`. An open tab checks on focus, becoming visible, or `pageshow`
(including browser back/forward restoration), with a 30-second throttle and a
five-second request timeout. There is no polling. Returning to an outdated tab
causes a normal reload when safe. An active input, an open dialog, or any edited
form field prevents automatic reload; after editing, normal navigation/reload
gets the update. A session-storage guard permits at most one automatic reload
per running build per tab. Offline or invalid responses do not trigger reloads.
An uninterrupted visible tab updates on its next navigation/reload or return.
Tabs running code from before this feature need one normal navigation/reload
before they can perform these checks.

## Cloudflare dashboard

Keep the current Tunnel hostname and origin unchanged. Tunnel transport needs no
cache changes. Account dashboard settings cannot be verified from this repository.

1. Select the **qvb.dev** zone → **Caching → Configuration → Browser Cache TTL**:
   choose **Respect Existing Headers**.
2. Review **Caching → Cache Rules**, legacy **Page Rules**, and any Workers or
   Cache Response Rules. Remove overrides that force HTML caching or replace its
   origin Cache-Control header. Default Cloudflare caching already leaves HTML
   uncached; no new rule is needed if there are no such overrides.
3. If an existing broad cache-everything rule must remain, add a Cache Rule named
   **Portfolio documents and unversioned resources**, after conflicting rules
   (last matching settings win), with this custom expression:

   ```text
   (http.host eq "qvb.dev" and not starts_with(http.request.uri.path, "/assets/"))
   ```

   Set **Cache eligibility: Bypass cache** and **Browser TTL: Respect origin**.
   Leave `/assets/` using origin cache headers. Do not apply a forced Browser TTL,
   Edge TTL, or cache-status TTL override to these document requests. This bypass
   affects only this host's documents/unversioned resources; immutable asset
   caching and all other hosts remain available.
4. If HTML was previously cached at the edge, use **Caching → Configuration →
   Purge Cache → Custom Purge → URLs** once for affected document URLs (including
   slash variants, `/`, `/index.html`, `/projects`, `/projects/gryd`, other project
   URLs, and `/version.json` if previously cached). Regular deployments need no
   purge after these policies are active. Existing fresh browser entries cannot
   be remotely revoked by a new origin header; these policies govern responses
   received after deployment.

References: [Cloudflare default cache behavior](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/),
[Browser Cache TTL](https://developers.cloudflare.com/cache/how-to/edge-browser-cache-ttl/),
[Cache Rules settings](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/).

## Verification

CI builds the actual Docker image and runs both checks against Nginx:

```sh
PORTFOLIO_PREVIEW_URL=http://127.0.0.1:18080 node scripts/cache-check.mjs
PORTFOLIO_PREVIEW_URL=http://127.0.0.1:18080 node scripts/deployment-check.mjs
```

The cache check requires production Nginx; Vite preview does not model its headers.
The deployment check uses existing Playwright, mocking only the version response
to exercise reloads, loop protection, form protection, dialogs and offline behavior.

After deployment:

```sh
curl -I https://qvb.dev/
curl -I https://qvb.dev/projects
curl -I https://qvb.dev/projects/gryd
curl -I https://qvb.dev/version.json
# Find a real current hashed URL in the page source, then:
curl -I https://qvb.dev/assets/<hashed-file>.js
PORTFOLIO_PREVIEW_URL=https://qvb.dev node scripts/cache-check.mjs
```

HTML must show `no-cache, must-revalidate` and should have Cloudflare status
`DYNAMIC` or `BYPASS` with the explicit bypass rule. Assets must show the one-year
immutable policy; missing assets must return 404. Navigate directly to project
pages and verify the generated content. Keep a tab open, deploy another build,
then switch away and return after 30 seconds: it should reload once. A second
return should not reload. Verify edited form inputs remain intact. A normal
reload or internal project link must load the latest content without a hard refresh.

Local validation alone does not update the deployed site or its dashboard rules.

## Validation in this change

Lint, all 11 default unit tests, the production build, and deployment-update
browser checks passed. Two consecutive builds confirmed that the manifest and
client version agree, changed JavaScript receives a different hash, and unchanged
CSS retains its filename. All generated project HTML and an ordinary reload
rendered in Chrome without application errors, using directory URLs because Vite
preview's extensionless fallback differs from production Nginx route resolution.

The existing browser-check script stops at its obsolete five-project assertion
(the current portfolio has six). The broader SEO browser script was killed
before completion. The optional screenshot pipeline suite hit a native Node
runtime assertion. These checks are not reported as passing.

The local Docker daemon was unavailable, so production Nginx header assertions
are added to CI but were not executed locally. Live checks before deployment
showed `/` and `/projects/gryd` returning 200 with no Cache-Control header and
Cloudflare `DYNAMIC`; a current hashed JS asset returned `max-age=31536000` and
Cloudflare `HIT`. Deployment and subsequent live verification remain necessary.
