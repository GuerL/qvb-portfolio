import { expect } from '@playwright/test';

async function landing({ page }) {
  await expect(page.getByRole('heading', { name: 'WhateverPeaks.' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'qvb.', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Multiplayer connects when you create or join a game');
  await expect(page.getByLabel('Playing as')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join Game', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(0);
}
export default {
  id: 'whateverpeaks', env: 'WHATEVERPEAKS_URL', url: process.env.WHATEVERPEAKS_URL || 'http://localhost:3000',
  scenes: [
    { id: 'landing', viewport: 'desktop', path: './', capture: landing, output: 'landing.webp' },
    { id: 'landing-mobile', viewport: 'mobile', path: './', capture: landing, output: 'landing-mobile.webp' },
  ],
};
