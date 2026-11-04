import { readFile, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { selectScenes } from './config.mjs';
import { validateWebp } from './images.mjs';

async function main() {
  const validated = [];
  // Validate every selected input before touching any production asset.
  for (const scene of selectScenes()) {
    let buffer;
    try {
      buffer = await readFile(scene.preview);
      await validateWebp(buffer, scene.viewport);
    } catch (error) {
      throw new Error(`${scene.project}/${scene.id}: ${error.message}. Run npm run screenshots with the same filters, then inspect the previews before publishing.`);
    }
    validated.push({ ...scene, buffer });
  }
  for (const scene of validated) {
    await mkdir(dirname(scene.destination), { recursive: true });
    const temporary = `${scene.destination}.tmp`;
    try {
      await writeFile(temporary, scene.buffer);
      await rename(temporary, scene.destination);
    } finally {
      await rm(temporary, { force: true });
    }
    console.log(`Updated ${scene.destination}`);
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
