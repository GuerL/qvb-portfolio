import { expect } from '@playwright/test';
import { demoReady } from '../readiness.mjs';

async function landing({ page }) {
  await demoReady(page);
  await expect(page.getByRole('heading', { name: 'Scopa Online.' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'qvb.', exact: true })).toBeVisible();
  await expect(page.locator('.title-dot')).toHaveText('.');
  await expect(page.getByRole('status')).toHaveText('Online');
  await expect(page.getByLabel('Playing as')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Room', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join Room', exact: true })).toBeVisible();
}
async function demo({ page, scene }) {
  await demoReady(page);
  await expect(page.getByText('Sofia', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Marco', { exact: true }).first()).toBeVisible();
  if (scene.id === 'lobby') {
    await expect(page.getByRole('heading', { name: 'SCOPA7' })).toBeVisible();
    await expect(page.locator('.players > *')).toHaveCount(2);
  } else if (scene.id === 'results') {
    await expect(page.getByRole('heading', { name: 'Round 2' })).toBeVisible();
    await expect(page.getByText('Settebello', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next round', exact: true })).toBeVisible();
  } else {
    await expect(page.getByRole('region', { name: 'Scopa game board', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Table cards', exact: true }).locator('button')).toHaveCount(4);
  }
}
export default {
  id: 'scopa', env: 'SCOPA_URL', url: process.env.SCOPA_URL || 'http://127.0.0.1:8082',
  frontendEnv: 'SCOPA_FRONTEND_DIR',
  captures: { landing, 'landing-mobile': landing, gameplay: demo, lobby: demo, results: demo, 'mobile-gameplay': demo },
};
