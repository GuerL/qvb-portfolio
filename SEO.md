# SEO foundation

## Audit and approach

The site uses React 19, TypeScript, Vite and plain anchors. `App.tsx` selects routes from `window.location.pathname`; there is no routing package. Project details come from `src/data/portfolio.ts`, which consumes external destinations from `src/data/projectLinks.ts`. External project applications are not portfolio routes.

Originally, `index.html` had English language, viewport, theme color, a title, description and custom SVG favicon. `scripts/metadata.mjs` already generated individual route metadata, OG tags, robots.txt, sitemap.xml and a noindex 404. These were build artifacts rather than files in `public/`. However, each page contained an empty React root, project components updated only their document title, Twitter metadata was incomplete, and there was no JSON-LD.

The build now compiles a temporary server entry using Vite and renders the **existing React components** with React's `renderToString`. This is build-time prerendering; Nginx continues serving static files. Browsers hydrate the rendered tree. No backend, runtime service, dependency, design or animation change is required. Development still works with client rendering. The temporary server bundle is deleted after generation and never shipped to Nginx.

`src/data/seo.ts` owns canonical origin, title/description generation, social tags, routes and JSON-LD. The build and browser share it. New projects in `portfolio.ts` automatically receive rendered HTML, metadata, structured data and a sitemap entry. Rebuild after adding projects or changing descriptions. Optional product title labels live in the same SEO configuration; the category supplies a default for new projects.

The canonical origin is always `https://qvb.dev`; legacy `VITE_SITE_URL` infrastructure arguments do not change it. OG image and favicon are preserved. Every page uses the existing 1200×630 `/og.png` with an absolute HTTPS URL and complete Open Graph and Twitter large-image metadata. Project previews have individual titles and descriptions but share the existing image.

Homepage JSON-LD contains `Person` and `WebSite`, with the verified GitHub and LinkedIn profiles. Project pages use `CreativeWork`: current data describes in-development/experimental work and does not establish release platforms, pricing or availability. No software releases, reviews, ratings or offers are asserted. JSON-LD serialization escapes HTML delimiters; tests parse and check its graph and verified fields. External schema validators should also be used after deployment; these checks do not claim a Google rich-result entitlement.

## Sitemap and HTTP behavior

The sitemap contains exactly:

- `https://qvb.dev/`
- `https://qvb.dev/projects/bifrost`
- `https://qvb.dev/projects/scopa-online`
- `https://qvb.dev/projects/whateverpeaks`
- `https://qvb.dev/projects/familylist`
- `https://qvb.dev/projects/echocue`

`/projects` is an existing alias that renders the homepage and scrolls to its project section. It remains available and canonicalizes to `/`; it is excluded as duplicate content. Trailing-slash variants canonicalize to the URLs above. Hash sections are not separate pages. No reliable modification dates exist, so `lastmod` is omitted. External apps, assets and errors are excluded.

Generated robots.txt allows all public paths and points to `https://qvb.dev/sitemap.xml`. Existing Nginx `try_files` serves route HTML and returns real HTTP 404 with a rendered noindex error document for missing paths. Vite's development/preview SPA fallback does not model production 404 behavior; test that with Nginx. Docker, Compose, Cloudflare Tunnel, public ports and runtime security headers are unchanged.

## Performance and accessibility

The original layout already uses system fonts (Inter is preferred only when installed), so there is no network font request or font-display delay to optimize. Screenshot/card images have known dimensions, lazy loading and async decoding; detail hero images load eagerly. Currently all projects use their existing CSS/SVG interface illustrations, with no configured screenshots. Keep future screenshots compressed as WebP/AVIF with accurate dimensions and descriptive alt text.

Prerendering makes text and illustrations available before JavaScript loads, helping initial content visibility. The client build measured approximately **259 kB JS / 81 kB gzip** and **28 kB CSS / 7 kB gzip**, including React, the existing UI/icons and SEO configuration. No dependencies were added. Animations, responsive layout and reduced-motion behavior are preserved. Hydration remains necessary for filters, mobile menus and screenshot controls; code splitting was not introduced without evidence of a meaningful bottleneck.

A single unthrottled local Chrome/Nginx smoke run measured **72 ms LCP**, **0 CLS**, and **64 ms** observed event durations for the project filter interaction. These are machine-specific lab observations, not production CWV or an INP field measurement. Production LCP, INP and CLS need real traffic/CrUX or PageSpeed Insights; network, device and Cloudflare behavior differ from localhost.

Pages retain one H1, main/header/footer/nav landmarks, section headings, visible keyboard focus, skip links, labeled mobile navigation and descriptive project links. Configured images require alt text and dimensions. Existing keyboard-accessible contact links and reduced-motion behavior passed browser regression checks. Desktop/mobile prerendered and hydrated screenshots matched exactly with animations frozen; no stylesheet or visual asset changed.

## Local verification and CI

```sh
npm ci
npm run lint
npm test
npm run build
npm run preview
# In another terminal; default is localhost:4173, local Google Chrome:
npm run test:seo
```

For Playwright's bundled Chromium instead of Chrome, run `npx playwright install chromium` and set `PLAYWRIGHT_BROWSER_CHANNEL=chromium`. CI installs Chromium and runs `test:seo` against the built Docker container with `CHECK_HTTP_404=1`. This validates generated HTML without application JavaScript, sitemap XML parsing, metadata uniqueness, canonical URLs, complete sharing tags, JSON-LD, HTTP content types, direct navigation, errors, hydration and desktop/mobile visual parity. Existing UI and contact scripts can also be run with `PORTFOLIO_PREVIEW_URL` pointing to the container.

Local production validation used a temporary Nginx container with the current dist and deployment configuration; all routes/assets and actual 404 responses passed. The existing live `/favicon.svg` and `/og.png` returned HTTP 200 with the expected content types. The new build has **not** been deployed.

## After deployment

Rebuild/restart the existing portfolio service following README deployment instructions. Then:

```sh
curl -fsS https://qvb.dev/robots.txt
curl -fsS https://qvb.dev/sitemap.xml
curl -fsS https://qvb.dev/projects/bifrost
curl -I https://qvb.dev/og.png
curl -I https://qvb.dev/favicon.svg
curl -I https://qvb.dev/a-page-that-does-not-exist
```

Inspect **View Source** on home and each sitemap URL: project content, title, description, canonical, OG/Twitter metadata and JSON-LD must exist without JavaScript. Disable JavaScript to confirm content accessibility; re-enable it to check filters, navigation and animations. The unknown URL must return HTTP 404.

Validate JSON-LD using Schema.org's Schema Markup Validator. Use Google's URL Inspection/rendered HTML and submit `/sitemap.xml` through Search Console. Check homepage and project links with LinkedIn Post Inspector and Facebook Sharing Debugger; request a new scrape if they show cached metadata. If Cloudflare still serves old HTML, purge the affected HTML/robots/sitemap URLs and retest. Preview caches and search indexing are external behavior and cannot be guaranteed by a build test.
