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
export const projects = [scopa, whateverpeaks];
export function selectScenes(args = process.argv.slice(2)) {
  const filters = {};
  for (const arg of args) {
    const match = /^--(project|scene)=(.+)$/.exec(arg);
    if (!match || filters[match[1]]) throw new Error(`Invalid or duplicate argument: ${arg}. Use --project=scopa --scene=landing`);
    filters[match[1]] = match[2];
  }
  const scenes = projects.flatMap(project => project.scenes.map(scene => ({
    ...scene, project: project.id, url: project.url, env: project.env,
    viewport: viewports[scene.viewport],
    preview: resolve(previewRoot, project.id, `${scene.id}.webp`),
    destination: resolve(root, 'public/images/projects', project.id, scene.output),
  }))).filter(scene => (!filters.project || scene.project === filters.project) && (!filters.scene || scene.id === filters.scene));
  if (!scenes.length) throw new Error('No matching scenes. Projects: scopa, whateverpeaks. Scenes: landing, landing-mobile.');
  return scenes;
}
