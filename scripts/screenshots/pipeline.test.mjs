import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, cp, symlink, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import sharp from 'sharp';
import { root } from './config.mjs';
const exec = promisify(execFile);

test('capture/publish isolation, filters, dimensions and invalid input safety', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'portfolio-screenshots-'));
  // Synthetic landing markup tests the pipeline only, never represents a real app capture.
  const server = createServer((request, response) => {
    if (request.url.startsWith('/unavailable')) { response.writeHead(503).end('Unavailable'); return; }
    const scopa = request.url.startsWith('/scopa');
    response.setHeader('Content-Type', 'text/html');
    response.end(`<html><body><h1>${scopa ? 'Scopa Online.' : 'WhateverPeaks.'}</h1><img alt="qvb." src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='36'%3E%3C/svg%3E"><span class="title-dot">.</span><div role="status">${scopa ? 'Online' : 'Multiplayer connects when you create or join a game'}</div><label>Playing as<input></label><button>${scopa ? 'Create Room' : 'Create Game'}</button><button>${scopa ? 'Join Room' : 'Join Game'}</button></body></html>`);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await mkdir(join(temporary, 'scripts'));
    await cp(join(root, 'scripts/screenshots'), join(temporary, 'scripts/screenshots'), { recursive: true });
    await symlink(join(root, 'node_modules'), join(temporary, 'node_modules'));
    const base = `http://127.0.0.1:${server.address().port}`;
    const env = { ...process.env, SCOPA_URL: `${base}/scopa/`, WHATEVERPEAKS_URL: `${base}/peaks/` };
    const run = (file, ...args) => exec(process.execPath, [join(temporary, 'scripts/screenshots', file), ...args], { env });
    const publicDir = join(temporary, 'public/images/projects/scopa');
    await mkdir(publicDir, { recursive: true });
    await writeFile(join(publicDir, 'cover.webp'), 'preserved cover');
    await run('capture.mjs', '--project=scopa', '--scene=landing');
    assert.deepEqual(await readdir(join(temporary, '.screenshots-preview/scopa')), ['landing.webp']);
    assert.deepEqual(await readdir(publicDir), ['cover.webp']);
    await assert.rejects(run('publish.mjs'), /ENOENT/);
    assert.deepEqual(await readdir(publicDir), ['cover.webp']);
    await run('publish.mjs', '--project=scopa', '--scene=landing');
    assert.equal(await readFile(join(publicDir, 'cover.webp'), 'utf8'), 'preserved cover');
    const desktop = await sharp(join(publicDir, 'landing.webp')).metadata();
    assert.equal(desktop.format, 'webp');
    assert.equal(desktop.width, 1600);
    assert.equal(desktop.height, 900);
    await run('capture.mjs');
    for (const project of ['scopa', 'whateverpeaks']) {
      const mobile = await sharp(join(temporary, `.screenshots-preview/${project}/landing-mobile.webp`)).metadata();
      assert.equal(mobile.width, 390);
      assert.equal(mobile.height, 844);
    }
    await run('publish.mjs');
    const before = await readFile(join(publicDir, 'landing.webp'));
    const preview = join(temporary, '.screenshots-preview/scopa/landing.webp');
    for (const invalid of [Buffer.from('bad'), await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } }).webp().toBuffer(), await sharp({ create: { width: 1600, height: 900, channels: 3, background: 'red' } }).png().toBuffer()]) {
      await writeFile(preview, invalid);
      await assert.rejects(run('publish.mjs', '--project=scopa', '--scene=landing'));
      assert.deepEqual(await readFile(join(publicDir, 'landing.webp')), before);
    }
    await assert.rejects(run('capture.mjs', '--project=unknown'), /No matching scenes/);
    await assert.rejects(run('publish.mjs', '--scene=unknown'), /No matching scenes/);
    await assert.rejects(run('capture.mjs', '--viewport=mobile'), /Invalid/);
    env.SCOPA_URL = `${base}/unavailable/`;
    await assert.rejects(run('capture.mjs', '--project=scopa', '--scene=landing'), /Application unavailable/);
    await assert.rejects(readFile(preview), /ENOENT/);
    assert.deepEqual(await readFile(join(publicDir, 'landing.webp')), before);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(temporary, { recursive: true, force: true });
  }
});
