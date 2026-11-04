# Portfolio screenshots

Development-only Playwright orchestration; independent apps must already be running.
No app imports, production routes, build hooks, or deployment changes are required.

```sh
npm ci
npx playwright install chromium
# Linux browser prerequisites if needed: npx playwright install --with-deps chromium
npm run screenshots
npm run screenshots -- --project=scopa
npm run screenshots -- --project=whateverpeaks --scene=landing
npm run screenshots -- --scene=landing-mobile
# Inspect the selected .screenshots-preview/<project>/<configured output filename> files first.
npm run screenshots:publish -- --project=scopa --scene=landing
npm run screenshots:publish
```

Environment variables (export them in the shell; no implicit .env loading):

- `SCOPA_URL`: default `http://localhost:8082` (verified in Scopa's compose file).
- `WHATEVERPEAKS_URL`: default `http://localhost:3000` (verified in its compose/Vite configuration).
- `SCREENSHOTS_BROWSER_CHANNEL`: optional installed browser channel, e.g. `chrome`; defaults to Playwright Chromium.

Start the applications using their own repository instructions, including the backend
(and WhateverPeaks database). No public domain or Cloudflare connection is needed.
Scopa requires the real Online health status. WhateverPeaks starts directly on its
multiplayer landing screen; its truthful initial status says that multiplayer connects
when creating/joining a game. Landing capture does not create a room or claim a live
multiplayer connection. Fresh browser contexts prevent persisted Continue/rejoin states.

Scene IDs, viewports and explicit output filenames live in `config.mjs`. Project modules
contain URL configuration and capture strategies only. Previews and published assets
use the same configured output filename, never a filename inferred from the scene ID.

Both projects map `landing` to `landing.webp` (1600×900) and `landing-mobile` to
`landing-mobile.webp` (390×844), at scale 1. Capture preserves the fixed visible viewport,
without scaling or cropping application elements. Scene assertions require branding and
all landing actions to be visible. PNG is an in-memory intermediate, encoded by the
development-only sharp dependency as WebP quality 90. Fonts and HTML images must finish
loading; new scenes using CSS background images must await those resources in their strategy.

Capture writes only ignored previews. Selected stale previews are removed at the start;
a failed scene cannot leave an old publishable preview. All selected files must decode
as static WebP at the configured dimensions before publish writes any destination.
Publishing is an explicit human validation step: inspect previews first. Copies replace
only mapped filenames, atomically per file (the batch is not a filesystem transaction).
It never deletes unrelated assets or commits/pushes. Landing files are additional assets;
the existing gameplay galleries and covers remain unchanged.

Run pipeline integration checks with `node --test scripts/screenshots/pipeline.test.mjs`.
They use synthetic markup and isolated temporary directories; they do not prove that the
real applications are available or healthy.

## Phase 2 checklist

- In each independent game repo, add development-only demo fixtures backed by real
  game/session logic. Use fixed seeds, deck arrangements, named players, a controlled
  clock, and explicit round/result states. Avoid random play or long click sequences.
- Scopa: fixture two-player rooms, known hands/table, ready lobby, round results and
  responsive gameplay. WhateverPeaks: fixed deck/seed, two-player competition, lobby,
  rankings and round results.
- Gate fixtures in the backend with an explicit local development profile, bind fixture
  controls to loopback, and exclude fixture handlers from production artifacts. Reject
  fixture startup in production; never expose public state-mutation routes. Add tests
  proving production builds cannot register these handlers. Keep fixtures owned by each
  app repo; orchestrate through documented local APIs, without source dependencies.
- The canonical Phase 2 scene mappings already exist in `config.mjs` (listed below).
  They are skipped by default and explicitly rejected by filtered capture/publish commands
  until a matching function is added to the project module’s `captures` object.
  Add new scene IDs, viewports and outputs only in `config.mjs`; URL comes from the
  project environment configuration. No runner or publisher changes are needed.
  Async strategies receive `{ page, context, browser, scene }`; create isolated extra
  contexts for the second player, verify real socket/player readiness, and close extra
  contexts/reset fixtures with `try/finally`.
- Map Scopa `gameplay` → `cover.webp`, `lobby` → `lobby.webp`, `results` → `results.webp`,
  `mobile-gameplay` → `mobile-gameplay.webp`. Map WhateverPeaks `gameplay` → `cover.webp`,
  `competition` → `competition.webp`, `lobby` → `lobby.webp`, `results` → `results.webp`.
  Only the gameplay strategy can activate the existing cover mapping; landing scenes
  retain separate filenames and never replace gameplay assets.
- Assert exact fixture identity, player count, connected state, deck and results before
  capture. Verify desktop/mobile framing, repeated-run consistency, cleanup and filtering.
- When replacing gallery assets, update their width/height metadata in
  `src/data/portfolio.ts` to the scene dimensions and run gallery browser checks.

## Existing PNG originals

Gallery references use WebP. These unreferenced project PNG originals are retained for
manual cleanup only (no PNGs are deleted or renamed by the pipeline):

- Scopa: `cover.png`, `gameplay-mobile.png`, `lobby.png`, `results.png`.
- WhateverPeaks: `cover.png`, `competition.png`, `lobby.png`, `results.png`.
- Bifrost (unchanged): `cover.png`, `environment.png`, `import.png`,
  `request-editor.png`, `response-viewer.png`.

`public/og.png` is referenced by SEO metadata and must be retained.
