import { expect } from '@playwright/test';
import { demoReady } from '../readiness.mjs';

async function landing({ page }) {
  await demoReady(page);
  await expect(page.getByRole('heading', { name: 'WhateverPeaks.' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'qvb.', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Multiplayer connects when you create or join a game');
  await expect(page.getByLabel('Playing as')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join Game', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(0);
}
async function demo({ page, scene }) {
  await demoReady(page);
  if (scene.id === 'lobby') {
    await expect(page.getByText('PEAKS7', { exact: true })).toBeVisible();
    await expect(page.locator('.player-row')).toHaveCount(2);
    await expect(page.getByText('CONNECTED', { exact: true })).toBeVisible();
  } else if (scene.id === 'results') {
    await expect(page.getByRole('heading', { name: 'Round Results', exact: true })).toBeVisible();
    await expect(page.locator('.results-list li')).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Next Round', exact: true })).toBeVisible();
  } else {
    await expect(page.getByRole('region', { name: 'Plateau Three Peaks', exact: true })).toBeVisible();
    await expect(page.getByText(scene.id === 'competition' ? '02:28' : '02:14', { exact: true })).toBeVisible();
  }
}
export default {
  id: 'whateverpeaks', env: 'WHATEVERPEAKS_URL', url: process.env.WHATEVERPEAKS_URL || 'http://127.0.0.1:3000',
  frontendEnv: 'WHATEVERPEAKS_FRONTEND_DIR',
  captures: { landing, 'landing-mobile': landing, gameplay: demo, lobby: demo, results: demo, competition: demo },
};
