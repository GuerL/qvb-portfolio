# Quentin Van Bever — portfolio

Existing React / TypeScript / Vite portfolio deployed at **https://qvb.dev**. Custom CSS, static hosting and isolated Docker deployment; no backend or database. Project enhancements retain the site's visual identity and existing sections.

## Development and checks

Node 24 and npm are required.

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

Development: http://127.0.0.1:5173. Build output: `dist/`. The preview server is for local checks only.

With the development server running and Google Chrome installed:

```sh
node scripts/browser-check.mjs
node scripts/project-check.mjs
```

The first checks existing sections, project routes, filters, mobile navigation and reduced motion. The second injects test-only links and images in the browser to check CTA variants, the gallery, keyboard navigation, modal focus containment/restoration and responsive layouts. No fixtures are saved in product configuration. Review screenshots are written to `/tmp`.

## Centralized project configuration

Edit `src/data/portfolio.ts`. Each project has `id`, `slug`, `name`, `tagline`, `description`, `status`, `technologies`, `features`, `technicalHighlights`, `screenshots`, and optional `liveUrl`, `websiteUrl`, `githubUrl`, `downloadUrl`, `thumbnail`, and `release`.

Edit `src/data/projectLinks.ts` to configure destinations for every project. Empty live/download URLs show visible disabled Play Now / Download buttons with a configuration message. Only valid HTTPS URLs without embedded credentials become clickable; missing GitHub/Website URLs remain omitted. Verify destinations before adding them. Only configure `githubUrl` if the repository is public. Public URLs belong in `src/data/projectLinks.ts`; no environment variables are necessary for them.

- Scopa Online / WhateverPeaks: `liveUrl` renders **Play Now** prominently on cards and detail pages.
- Bifrost: `downloadUrl` renders **Download**; optional public repository and product website render **GitHub** and **Website**. Add `release: { version: 'ACTUAL_VERSION', platforms: ['ACTUAL_RELEASE_PLATFORM'] }` only from actual release information.
- FamilyList: shows status; no launch/download controls unless a real URL is configured.
- EchoCue: details and an optional public repository link; no inferred download.

Update `status` and deployment notes together after verifying availability. The status remains conservative while no public distribution is configured. Reconnection and real-time synchronization coverage should only be claimed after implementation is confirmed.

Contact links remain configurable in `profile`. Never commit private infrastructure endpoints or credentials. `VITE_` values become public build inputs.

## Local screenshots

Store original application captures in:

```text
public/images/projects/bifrost/
public/images/projects/scopa/
public/images/projects/whateverpeaks/
public/images/projects/familylist/
public/images/projects/echocue/
```

No real application screenshots were supplied with this repository. Existing illustrations remain labeled; they are not screenshots. The empty directories are intentional.

Prefer optimized WebP or AVIF. PNG/JPEG are supported when appropriate. Avoid private data in captures. Measure the image's actual dimensions and configure each entry:

```ts
screenshots: [
  {
    src: '/images/projects/bifrost/requests.webp',
    alt: 'Bifrost request editor showing the response to an HTTP request',
    caption: 'Request editing and response inspection',
    order: 0,
    width: 1600,
    height: 1000,
  },
],
```

This is a schema example, not a shipped screenshot. Only add the entry after placing the actual file. Positive intrinsic dimensions reserve space before loading. Captions are optional; accessible alt text and display order are required. Images are sorted by order without mutating configuration. The first ordered screenshot becomes the detail hero; an optional `thumbnail` with the same schema selects the card visual. Without media, existing labeled illustrations remain.

The gallery uses lazy-loaded local images and a native modal dialog. Click a thumbnail to expand, use previous/next buttons or left/right arrows, and press Escape to close. Focus stays within the modal and returns to its trigger. Single-image galleries disable previous/next controls. Screenshots cannot reference remote hosts or traversal paths. Invalid media entries are omitted, and configured file existence is checked by tests.

Vite copies `public/` into `dist/`; Docker copies all of `dist/` into Nginx. Rebuild after adding assets. Nginx serves WebP, AVIF, PNG and JPEG directly with real missing-file 404 responses.

## Production and existing deployment

The current `compose.yaml` has service `portfolio`, fixed container name `qvb-portfolio`, network alias `qvb-portfolio`, and host mapping **8085 → 8080**. These existing settings are preserved to avoid breaking your deployed origin. It joins external **apps-network**, uses a read-only runtime, bounded logs, `unless-stopped`, an unprivileged Nginx image and `/healthz`.

The SEO canonical origin is fixed to `https://qvb.dev` in `src/data/seo.ts`, including preview builds. The existing `VITE_SITE_URL` build argument is retained for infrastructure compatibility; it does not override SEO URLs. See [SEO.md](SEO.md) for the audit, rendering approach, validation and deployment checks.

On the existing deployment host:

```sh
# If .env does not already exist, copy .env.example and review it.
docker compose config --quiet
docker compose build portfolio
docker compose up -d portfolio
docker compose ps
docker compose exec portfolio wget -qO- http://127.0.0.1:8080/healthz
```

Do not overwrite an existing `.env`, recreate the network, or stop other services. The fixed container name means this Compose file should only manage the existing intended deployment, not a second instance alongside it. For a second instance, explicitly choose unique names/aliases and a different host mapping or no published port.

Keep the existing Cloudflare Tunnel route unchanged if already working. When its cloudflared container shares apps-network, the internal origin can be **http://qvb-portfolio:8080** for public hostname **qvb.dev**. A tunnel running on the host may currently use the preserved host port 8085. Do not alter its topology as part of this UI update. Preserve all other tunnel routes and never publish Proxmox, Portainer, databases or management services.

After deploying media, verify actual direct URLs, for example:

```sh
curl --fail --head https://qvb.dev/images/projects/bifrost/requests.webp
```

Substitute an actual configured filename. Check the content type, load the image in a browser and verify all configured live/download links. Post-deployment verification requires the real screenshots and access to the updated deployment; local tests do not imply the public site has been updated.

## Architecture

- `src/data/portfolio.ts`: project/contact configuration, link/action selection and local-media validation.
- `src/components/ProjectActions.tsx`: shared card/detail CTA styles and safe external links.
- `src/components/ScreenshotGallery.tsx`: responsive gallery and keyboard-accessible native dialog.
- `src/components/ProjectVisual.tsx`: original labeled fallback illustrations.
- `src/App.tsx`: existing sections, project pages and release/media presentation.
- `src/styles.css`: existing design and additive project/gallery styles.
- `scripts/metadata.mjs`: per-route metadata, canonical links, sitemap, robots and 404.
- `deploy/nginx.conf`: static route serving, security headers, media types and health endpoint.

Known routes have individual generated HTML entry files containing the existing React content, rendered at build time and hydrated in the browser. Unknown routes return HTTP 404 with the custom page. A future API should be a separate Java / Spring Boot service; none is needed for these improvements.

## Validation

Build, lint and tests validate the frontend and configuration. Browser checks cover the existing portfolio and optional screenshot/CTA states without publishing test data. An isolated test Docker image was built and tested on apps-network without replacing the running portfolio. Production Nginx configuration, routes, health and local static-image serving were checked. Actual application screenshots/URLs are still required before their public availability can be verified.

## Missing-button fix

The previous action selector omitted missing URLs, and the component returned null for empty actions. Cards now always have an action area. Scopa and WhateverPeaks show Play Now, and Bifrost shows Download, even before destinations are populated. Disabled actions have an adjacent explanation; repository links appear only when configured. FamilyList/EchoCue show a truthful availability note if no public links exist.

No project application, release or repository URLs were found in source, environment examples or documentation. The Git remote points to the portfolio repository, which is not a destination for the other projects. Populate `projectLinks.scopa.liveUrl`, `projectLinks.whateverpeaks.liveUrl`, `projectLinks.bifrost.downloadUrl`, and any project's `githubUrl`; Bifrost's `websiteUrl` is optional.

Run `npm run dev` and open http://127.0.0.1:5173/#projects to see the buttons immediately. Run `node scripts/action-check.mjs` against a dev or preview server to validate unconfigured actions; `node scripts/project-check.mjs` against the dev server tests enabled actions and gallery states with browser-only fixtures. Rebuild/redeploy the portfolio service for qvb.dev to receive the changes.
