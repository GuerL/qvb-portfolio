import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

async function available(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
    await response.body?.cancel();
    return response.ok;
  } catch { return false; }
}

export async function startServers(scenes) {
  const children = [];
  const stop = async () => {
    for (const child of children) {
      if (!child.pid) continue;
      // Each spawned npm command owns a process group; never kill existing servers.
      try { process.kill(-child.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    }
    await Promise.all(children.map(async child => {
      if (!child.pid) return;
      const deadline = Date.now() + 3000;
      while (child.exitCode === null && child.signalCode === null && Date.now() < deadline) await delay(50);
      try { process.kill(-child.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    }));
  };
  const interrupted = signal => { void stop().finally(() => process.exit(signal === 'SIGINT' ? 130 : 143)); };
  process.once('SIGINT', interrupted);
  process.once('SIGTERM', interrupted);
  const cleanup = async () => {
    await stop();
    process.removeListener('SIGINT', interrupted);
    process.removeListener('SIGTERM', interrupted);
  };
  try {
    for (const scene of new Map(scenes.map(scene => [scene.project, scene])).values()) {
      const url = new URL(scene.url);
      if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error(`${scene.env} must point to a local screenshot development server, not ${url.hostname}`);
      if (await available(url)) { console.log(`Using existing ${scene.project} server at ${url}`); continue; }
      const directory = process.env[scene.frontendEnv];
      if (!directory) throw new Error(`${scene.project} screenshot server unavailable at ${url}. Set ${scene.frontendEnv} to its frontend directory, or start npm run dev:screenshots there. Install its dependencies first.`);
      let manifest;
      try { manifest = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8')); }
      catch (error) { throw new Error(`${scene.frontendEnv}=${directory}: cannot read frontend package.json. ${error.message}`); }
      if (!manifest.scripts?.['dev:screenshots']) throw new Error(`${scene.frontendEnv}: package.json must provide dev:screenshots`);
      let logs = '';
      const child = spawn('npm', ['run', 'dev:screenshots'], { cwd: directory, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
      children.push(child);
      let spawnError;
      child.on('error', error => { spawnError = error; });
      for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { logs = (logs + data).slice(-5000); });
      const deadline = Date.now() + 30000;
      while (!await available(url)) {
        if (spawnError || child.exitCode !== null || Date.now() >= deadline) throw new Error(`${scene.project}: npm run dev:screenshots failed to serve ${url}. Check ${scene.frontendEnv}, dependencies and port configuration. ${spawnError?.message || ''}\n${logs}`);
        await delay(200);
      }
      console.log(`Started ${scene.project} screenshot server at ${url}`);
    }
    return cleanup;
  } catch (error) { await cleanup(); throw error; }
}
