# Portfolio screenshots

Development-only Playwright capture of the independent apps. No production build,
Docker, game source, backend fixture API, or deployment changes are required.

```sh
npm ci
npx playwright install chromium
# Export your own frontend paths once in your shell:
export SCOPA_FRONTEND_DIR="/path/to/Scopa/frontend"
export WHATEVERPEAKS_FRONTEND_DIR="/path/to/WhateverPeaks/frontend"
npm run screenshots
# Review .screenshots-preview/scopa/ and .screenshots-preview/whateverpeaks/
npm run screenshots:publish
```

Install each frontend's dependencies in its repository first. Paths are optional if
its server is already running with `npm run dev:screenshots`. The pipeline probes
selected projects, starts unavailable servers with exactly that command, waits up to
30 seconds for HTTP availability, and terminates only process groups it started,
including on errors, SIGINT and SIGTERM. Existing processes are left running. It
never starts a normal development or production server. Existing servers must also
use screenshots mode; demo readiness will fail on a normal server.

All twelve scenes use deterministic development fixtures through
`/?screenshot=<scene>`, including `landing` and `landing-mobile`. No Spring Boot
backend or database is required. Both frontends must provide all six fixture IDs,
including `landing` and `landing-mobile`; older fixture implementations that omit
them must be updated in their owning repository before capture can succeed.
Scopa's landing fixture displays `Online` without
performing a real backend health check. WhateverPeaks retains its initial multiplayer
status. Every capture waits for the fixture's readiness signal before saving.

Environment variables (export explicitly; no implicit `.env` loading):

- `SCOPA_FRONTEND_DIR`, `WHATEVERPEAKS_FRONTEND_DIR`: independent frontend paths.
- `SCOPA_URL`: defaults to `http://127.0.0.1:8082`.
- `WHATEVERPEAKS_URL`: defaults to `http://127.0.0.1:3000`.
- `SCREENSHOTS_BROWSER_CHANNEL`: optional installed browser, e.g. `chrome`.

Only loopback URLs are supported. A URL override must match the frontend's configured
listening port; the runner does not change game configuration. Missing paths, missing
`dev:screenshots` scripts, startup failures and unavailable servers produce actionable
errors. Browser installation on Linux may require `npx playwright install --with-deps chromium`.

| Project | Scene | URL path | Preview / destination filename | Viewport |
| --- | --- | --- | --- | --- |
| Both | landing | /?screenshot=landing | landing.webp | 1600×900 |
| Both | landing-mobile | /?screenshot=landing-mobile | landing-mobile.webp | 390×844 |
| Scopa | gameplay | /?screenshot=gameplay | cover.webp | 1600×900 |
| Scopa | lobby | /?screenshot=lobby | lobby.webp | 1600×900 |
| Scopa | results | /?screenshot=results | results.webp | 1600×900 |
| Scopa | mobile-gameplay | /?screenshot=mobile-gameplay | mobile-gameplay.webp | 390×844 |
| WhateverPeaks | gameplay | /?screenshot=gameplay | cover.webp | 1600×900 |
| WhateverPeaks | lobby | /?screenshot=lobby | lobby.webp | 1600×900 |
| WhateverPeaks | competition | /?screenshot=competition | competition.webp | 1600×900 |
| WhateverPeaks | results | /?screenshot=results | results.webp | 1600×900 |

Explicit mappings live in `config.mjs`. WebP encoding uses quality 90, scale 1, with
no resizing or full-page capture. Each scene gets a fresh context, en-US locale,
UTC timezone, dark color scheme and reduced motion. Demo captures wait for
`#root[data-screenshot-ready="true"]` and assert scene-specific visible content.
Fonts, HTML and CSS background images, viewport size, horizontal overflow, visible
application errors, JavaScript errors and failed HTTP resources are checked before
saving. No fixed screenshot delay is used.

Filtering works for capture and publish:

```sh
npm run screenshots -- --project=scopa
npm run screenshots -- --project=whateverpeaks
npm run screenshots -- --project=scopa --scene=gameplay
npm run screenshots -- --scene=gameplay
npm run screenshots:publish -- --project=scopa
npm run screenshots:publish -- --project=scopa --scene=gameplay
```

Capture writes only ignored `.screenshots-preview/<project>/<output>` files, using
atomic replacement after decoding and validating the new WebP. A failed attempt
retains the last valid preview. A `.pending` marker blocks publishing that selected
preview until successful recapture, including after interruption. Do not remove the
marker to bypass validation. A failed full run can still leave independently valid
successful scenes; publishing the full selection is blocked if any scene is pending.
Avoid concurrent capture/publish runs in the same workspace.

Publish validates **all** selected previews before writing any public file: pending
state, full image decoding, static WebP format and exact dimensions. It atomically
replaces only explicitly mapped files in `public/images/projects/<project>/` (the
batch is not a filesystem transaction). Landing remains separate from gameplay cover.
Unrelated files and PNG originals are retained. Nothing commits or pushes to Git.
Inspect previews before publishing. SIGKILL/power loss cannot perform process cleanup;
retained pending markers still block incomplete previews.

```sh
node --test scripts/screenshots/pipeline.test.mjs
npm run build
```

Integration tests use synthetic markup and isolated public/preview directories;
they do not substitute for real demo capture validation. Playwright and sharp remain
development dependencies, and screenshots never run as part of the production build.
