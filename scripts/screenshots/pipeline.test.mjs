import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, cp, symlink, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import sharp from 'sharp';
import { root, projects, sceneConfig, selectScenes } from './config.mjs';
import { basename } from 'node:path';
const exec = promisify(execFile);

test('canonical mappings match existing gallery assets and previews', async () => {
  const expected = {
    scopa: ['cover.webp', 'lobby.webp', 'results.webp', 'mobile-gameplay.webp'],
    whateverpeaks: ['cover.webp', 'competition.webp', 'lobby.webp', 'results.webp'],
  };
  const gallery = await readFile(join(root, 'src/data/portfolio.ts'), 'utf8');
  for (const project of projects) {
    const canonical = sceneConfig[project.id].filter(scene => !scene.id.startsWith('landing'));
    assert.deepEqual(canonical.map(scene => scene.output), expected[project.id]);
    for (const scene of canonical) {
      const asset = `/images/projects/${project.id}/${scene.output}`;
      assert.ok(gallery.includes(`src:'${asset}'`), asset);
      assert.equal((await sharp(join(root, 'public', asset)).metadata()).format, 'webp');
    }
  }
  for (const scene of selectScenes([])) {
    assert.equal(basename(scene.preview), scene.output);
    assert.equal(basename(scene.destination), scene.output);
    assert.equal(typeof scene.capture, 'function');
  }
});

test('capture/publish isolation, filters, dimensions and invalid input safety', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'portfolio-screenshots-'));
  // Synthetic landing markup tests the pipeline only, never represents a real app capture.
  let fault = '';
  const server = createServer((request, response) => {
    if (request.url.startsWith('/unavailable')) { response.writeHead(503).end('Unavailable'); return; }
    const scopa = request.url.startsWith('/scopa');
    response.setHeader('Content-Type', 'text/html');
    const scene = new URL(request.url, 'http://localhost').searchParams.get('screenshot');
    if (scene) {
      const content = scopa
        ? scene === 'lobby' ? '<h1>SCOPA7</h1><div class="players"><span>Sofia</span><span>Marco</span></div>'
          : scene === 'results' ? '<h1>Round 2</h1><span>Sofia</span><span>Marco</span><span>Settebello</span><button>Next round</button>'
          : '<span>Sofia</span><span>Marco</span><section aria-label="Scopa game board">Board</section><section aria-label="Table cards"><button></button><button></button><button></button><button></button></section>'
        : scene === 'lobby' ? '<span>PEAKS7</span><div class="player-row"></div><div class="player-row"></div><span>CONNECTED</span>'
          : scene === 'results' ? '<h2>Round Results</h2><ol class="results-list"><li>Sofia</li><li>Marco</li></ol><button>Next Round</button>'
          : `<section aria-label="Plateau Three Peaks">Board</section><span>${scene === 'competition' ? '02:28' : '02:14'}</span>`;
      response.end(`<html><body><div id="root" ${fault === 'readiness' ? '' : 'data-screenshot-ready="true"'}>${content}${fault === 'javascript' ? '<script>throw new Error("fixture failure")</script>' : ''}${fault === 'image' ? '<img src="/unavailable/image">' : ''}${fault === 'overflow' ? '<div style="width:2000px">Overflow</div>' : ''}</div></body></html>`);
      return;
    }
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
    const invalidPreview = await readFile(preview);
    env.SCOPA_URL = `${base}/unavailable/`;
    await assert.rejects(run('capture.mjs', '--project=scopa', '--scene=landing'), /server unavailable/);
    assert.deepEqual(await readFile(preview), invalidPreview);
    await assert.rejects(run('publish.mjs', '--project=scopa', '--scene=landing'), /capture failed or was interrupted/);
    assert.deepEqual(await readFile(join(publicDir, 'landing.webp')), before);
    env.SCOPA_URL = `${base}/scopa/`;
    await run('capture.mjs', '--project=scopa', '--scene=gameplay');
    const coverPreview = await readFile(join(temporary, '.screenshots-preview/scopa/cover.webp'));
    await assert.rejects(readFile(join(temporary, '.screenshots-preview/scopa/gameplay.webp')), /ENOENT/);
    await run('publish.mjs', '--project=scopa', '--scene=gameplay');
    assert.deepEqual(await readFile(join(publicDir, 'cover.webp')), coverPreview);
    assert.deepEqual(await readFile(join(publicDir, 'landing.webp')), before);
    const validCover = await readFile(join(temporary, '.screenshots-preview/scopa/cover.webp'));
    for (const failure of ['readiness', 'javascript', 'image', 'overflow']) {
      fault = failure;
      await assert.rejects(run('capture.mjs', '--project=scopa', '--scene=gameplay'), /readiness|fixture failure|Image|image|overflow/);
      assert.deepEqual(await readFile(join(temporary, '.screenshots-preview/scopa/cover.webp')), validCover);
      await assert.rejects(run('publish.mjs', '--project=scopa', '--scene=gameplay'), /capture failed or was interrupted/);
      assert.deepEqual(await readFile(join(publicDir, 'cover.webp')), validCover);
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(temporary, { recursive: true, force: true });
  }
});

test('automatic server startup, missing repository and owned-process cleanup', async () => {
  const { startServers } = await import('./servers.mjs');
  const temporary = await mkdtemp(join(tmpdir(), 'portfolio-screenshot-server-'));
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const env = 'PORTFOLIO_TEST_FRONTEND_DIR';
  const scene = { project: 'fixture', frontendEnv: env, env: 'FIXTURE_URL', url: `http://127.0.0.1:${port}` };
  let stop;
  try {
    await assert.rejects(startServers([scene]), /Set PORTFOLIO_TEST_FRONTEND_DIR/);
    process.env[env] = join(temporary, 'missing');
    await assert.rejects(startServers([scene]), /cannot read frontend package.json/);
    process.env[env] = temporary;
    await writeFile(join(temporary, 'package.json'), JSON.stringify({ scripts: { 'dev:screenshots': 'node server.cjs' } }));
    await writeFile(join(temporary, 'server.cjs'), `require('node:http').createServer((req,res)=>res.end('fixture')).listen(${port}, '127.0.0.1');`);
    stop = await startServers([scene]);
    assert.equal((await fetch(scene.url)).status, 200);
    // Reusing a server must not claim ownership of it.
    const stopReused = await startServers([scene]);
    await stopReused();
    assert.equal((await fetch(scene.url)).status, 200);
    await stop();
    stop = undefined;
    await assert.rejects(fetch(scene.url));
    await mkdir(join(temporary, 'scripts'));
    await cp(join(root, 'scripts/screenshots'), join(temporary, 'scripts/screenshots'), { recursive: true });
    await symlink(join(root, 'node_modules'), join(temporary, 'node_modules'));
    const capture = spawn(process.execPath, [join(temporary, 'scripts/screenshots/capture.mjs'), '--project=scopa', '--scene=gameplay'], {
      env: { ...process.env, SCOPA_URL: scene.url, SCOPA_FRONTEND_DIR: temporary }, stdio: 'ignore',
    });
    const exited = once(capture, 'exit');
    try {
      let ready = false;
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline && !ready) {
        try { ready = (await fetch(scene.url)).ok; } catch { await delay(100); }
      }
      assert.ok(ready, 'owned server became available before interruption');
      capture.kill('SIGTERM');
      assert.equal((await exited)[0], 143);
      await assert.rejects(fetch(scene.url));
      assert.match(await readFile(join(temporary, '.screenshots-preview/scopa/cover.webp.pending'), 'utf8'), /incomplete/);
    } finally {
      if (capture.exitCode === null && capture.signalCode === null) { capture.kill('SIGTERM'); await exited; }
    }
  } finally {
    await stop?.();
    delete process.env[env];
    await rm(temporary, { recursive: true, force: true });
  }
});
