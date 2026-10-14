# Quentin Van Bever — personal portfolio

A custom React / TypeScript portfolio for an independent software engineer. Static frontend, no backend or database required. Includes five typed projects, project detail routes, responsive CSS, keyboard navigation, reduced-motion support, accessible icons, generated SEO metadata, sitemap, social preview and custom 404.

## Local development

Requires Node 24 and npm.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm run lint
npm test
```

Development URL: http://127.0.0.1:5173. Build output: `dist/`. `npm run preview` is a local preview, not a production server.

`node scripts/browser-check.mjs` checks desktop, tablet and mobile layouts, all project routes, filters, mobile navigation and reduced motion against the development server. It requires installed Google Chrome. It writes review screenshots to `/tmp` and regenerates `public/og.png` from `public/og.svg`; rebuild afterward. For a different browser installation, adapt the Playwright launch configuration.

## Content and public links

Edit **`src/data/portfolio.ts`**. This is the single source for project content, technologies, screenshots, features, statuses and links. Contact links live in `profile` in the same file.

- Add confirmed `liveUrl`, `githubUrl` and `downloadUrl` values. The UI only renders valid HTTPS links, with safe external-link attributes. Play Now appears for a configured live URL.
- Configure GitHub, LinkedIn, email and optionally the CV URL. Contact currently shows a truthful availability note because none were supplied.
- Use `Live` only after verifying a deployed product. Bifrost, Scopa Online and WhateverPeaks default to `In Development` because public availability was not confirmed. Revise their deployment notes when availability is verified.
- Actual screenshots go under `public/images/`, preferably optimized WebP/AVIF. Set `screenshots: [{ src: '/images/bifrost.webp', alt: 'A descriptive caption' }]`. Detail pages render them lazily. The existing CSS illustrations are explicitly labeled as illustrations; they are not application screenshots.
- Engineering considerations describe the supplied project architecture, not claimed measured outcomes. Reconnection and synchronization coverage remain unconfirmed where appropriate.
- Never place credentials or private endpoints in content, environment variables prefixed `VITE_`, or public assets.

Set `VITE_SITE_URL` to the canonical HTTPS origin. The default is **https://guerl.dev**, matching the supplied infrastructure. **https://vbever.dev** is also documented below, as requested. Choose the actual domain you control before publishing; canonical metadata and sitemap are generated during the build. Local `npm run build` can use `VITE_SITE_URL=https://vbever.dev npm run build`; Compose reads it from `.env`.

## Production with existing Docker infrastructure

The multistage Dockerfile builds with Node and serves with unprivileged Nginx on **8080 inside the container**. Compose attaches only this service to the existing external `apps-network`. There are no published host ports, no database, no tunnel credentials and no changes to existing services. Runtime filesystem is read-only with a small `/tmp` tmpfs. Logging is bounded; restart policy is `unless-stopped`.

Run on your Ubuntu VM, from this project directory. First inspect names and network aliases without changing anything:

```sh
docker network inspect apps-network --format '{{range .Containers}}{{println .Name}}{{end}}'
docker ps --format '{{.Names}}'
```

For each container on that network, inspect aliases using `docker inspect --format '{{range .NetworkSettings.Networks}}{{json .Aliases}}{{end}}' CONTAINER_NAME`. If any service already uses `portfolio`, **rename the service key** in `compose.yaml` to `qvb-portfolio-web`, set `PORTFOLIO_NETWORK_ALIAS=qvb-portfolio-web`, and use that name in the tunnel route. Changing only the alias is insufficient because Compose also registers the service name. Do not modify or stop existing containers. No fixed `container_name` is used.

The external network must already exist on the deployment VM. If it is missing, investigate the existing infrastructure rather than creating/replacing it blindly.

```sh
cp .env.example .env
# Edit .env: select canonical domain and a non-conflicting alias.
docker compose config --quiet
docker compose build
docker compose up -d portfolio
docker compose ps
docker compose exec portfolio wget -qO- http://127.0.0.1:8080/healthz
```

If you renamed the service, substitute its name in commands. Health must report `healthy`. To stop only this project: `docker compose down` (external network is preserved). Update by rebuilding and running `docker compose up -d portfolio`; retain the previous image tag for rollback if desired.

## Existing Cloudflare Tunnel integration

Use your **existing** tunnel; do not create another tunnel or inbound router mapping. Its `cloudflared` container must already be on `apps-network`. If it is not, reconcile that with your existing tunnel Compose configuration rather than editing other services from this project.

In Cloudflare Zero Trust, open the existing tunnel and add a published application route:

| Field | Value |
| --- | --- |
| Hostname | `vbever.dev` (or `guerl.dev`, your chosen canonical domain) |
| Service type | HTTP |
| Service URL | `http://portfolio:8080` |
| Path | Leave empty |

Use `http://qvb-portfolio-web:8080` if you selected that non-conflicting service name. Public HTTPS terminates at Cloudflare; Nginx receives internal HTTP. Do not use `localhost` in a separate cloudflared container. Preserve every existing route. Follow Cloudflare's DNS routing prompt for a domain in your account. Only add this public portfolio origin; never add Proxmox, Portainer, databases or management endpoints.

For a locally managed tunnel, add only this rule **before** the existing final catch-all in your existing tunnel configuration, preserving all other rules:

```yaml
ingress:
  # ... existing routes, unchanged ...
  - hostname: vbever.dev
    service: http://portfolio:8080
  # ... existing catch-all, unchanged ...
```

This is an excerpt, not a replacement tunnel file. Do not copy tunnel tokens into this repository. If using `guerl.dev`, substitute that hostname and rebuild with the matching `VITE_SITE_URL`. If both domains resolve, configure a Cloudflare redirect to the canonical domain to avoid duplicate indexing.

After routing: visit the homepage and all five project URLs over HTTPS, confirm `/healthz`, confirm an unknown route returns HTTP 404, and inspect browser requests for errors. Verify configured external links manually before release.

References: [Docker external networking](https://docs.docker.com/compose/how-tos/networking/), [Cloudflare Tunnel routing](https://developers.cloudflare.com/tunnel/concepts/routing/), [Vite production deployment](https://vite.dev/guide/static-deploy.html).

## Architecture

- `src/data/portfolio.ts`: typed content and safe link helpers.
- `src/components/ProjectVisual.tsx`: labeled illustrations, no external requests.
- `src/App.tsx`: reusable cards/actions, sections, project pages and custom 404.
- `src/styles.css`: design tokens, responsive layouts, focus states, reduced motion.
- `scripts/metadata.mjs`: generates real HTML entry files with per-project SEO, sitemap and robots.
- `deploy/nginx.conf`: route serving, security headers, missing-asset 404s and health endpoint.

Known routes have generated entry files; Nginx serves each route's HTML and React renders its content. Unknown routes return a real HTTP 404 with the React custom 404 screen. This avoids silently returning a 200 homepage for invalid URLs. Adding a project automatically generates its route on build. CSS-only ambient animation avoids an animation dependency for this small scope.

A future contact or project management API should be a separate Java 21+ / Spring Boot service with dedicated DTOs and service/repository boundaries. Put API clients in a frontend `services/` module; add an explicit Nginx `/api/` proxy only when needed. Keep database and admin access private. No speculative backend has been introduced.

## Validation and release status

Local TypeScript/build, ESLint and three link/data integrity tests pass. Headless Chrome checks desktop, tablet and mobile overflow, project filters, all five detail routes, custom 404, menu behavior and reduced motion. Desktop/mobile screenshots were visually reviewed. No external personal/project links are configured, so none are presented as working.

The development machine has a Docker CLI but **no running Docker daemon**. Compose syntax is validated, but local image building, Nginx runtime and joining the actual home-server network remain unverified. The included GitHub Actions workflow builds and smoke-tests the image using an isolated temporary container without touching other services. Run it or the deployment checks above before treating the container as verified. No server or Cloudflare account was accessed or modified.
