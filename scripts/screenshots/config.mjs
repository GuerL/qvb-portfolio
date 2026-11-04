import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import scopa from './projects/scopa.mjs';
import whateverpeaks from './projects/whateverpeaks.mjs';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const previewRoot = resolve(root, '.screenshots-preview');
export const viewports = {
  desktop: { width: 1600, height: 900 },
  mobile: { width: 390, height: 844 },
};
// Single source of truth for scene IDs, framing and explicit filenames.
export const sceneConfig = {
  scopa: [
    { id: 'landing', viewport: 'desktop', output: 'landing.webp' },
    { id: 'landing-mobile', viewport: 'mobile', output: 'landing-mobile.webp' },
    { id: 'gameplay', viewport: 'desktop', output: 'cover.webp' },
    { id: 'lobby', viewport: 'desktop', output: 'lobby.webp' },
    { id: 'results', viewport: 'desktop', output: 'results.webp' },
    { id: 'mobile-gameplay', viewport: 'mobile', output: 'mobile-gameplay.webp' },
  ],
  whateverpeaks: [
    { id: 'landing', viewport: 'desktop', output: 'landing.webp' },
    { id: 'landing-mobile', viewport: 'mobile', output: 'landing-mobile.webp' },
    { id: 'gameplay', viewport: 'desktop', output: 'cover.webp' },
    { id: 'competition', viewport: 'desktop', output: 'competition.webp' },
    { id: 'lobby', viewport: 'desktop', output: 'lobby.webp' },
    { id: 'results', viewport: 'desktop', output: 'results.webp' },
  ],
};
export const projects = [scopa, whateverpeaks].map(project => ({
  ...project,
  scenes: sceneConfig[project.id].map(scene => ({
    ...scene, path: `./?screenshot=${scene.id}`, capture: project.captures[scene.id],
  })),
}));
export function selectScenes(args = process.argv.slice(2)) {
  const filters = {};
  for (const arg of args) {
    const match = /^--(project|scene)=(.+)$/.exec(arg);
    if (!match || filters[match[1]]) throw new Error(`Invalid or duplicate argument: ${arg}. Use --project=scopa --scene=landing`);
    filters[match[1]] = match[2];
  }
  const scenes = projects.flatMap(project => project.scenes.map(scene => ({
    ...scene, project: project.id, url: project.url, env: project.env,
    viewport: viewports[scene.viewport], frontendEnv: project.frontendEnv,
    preview: resolve(previewRoot, project.id, scene.output),
    destination: resolve(root, 'public/images/projects', project.id, scene.output),
  }))).filter(scene => (!filters.project || scene.project === filters.project) && (!filters.scene || scene.id === filters.scene));
  if (!scenes.length) throw new Error('No matching scenes. Check the project and scene IDs in scripts/screenshots/config.mjs.');
  if (filters.scene && scenes.some(scene => !scene.capture)) {
    throw new Error(`Scene ${filters.scene} requires a Phase 2 capture strategy; no files were changed.`);
  }
  return scenes.filter(scene => typeof scene.capture === 'function');
}
