import { expect } from '@playwright/test';

async function landing({ page }) {
  await expect(page.getByRole('heading', { name: 'Scopa Online.' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'qvb.', exact: true })).toBeVisible();
  await expect(page.locator('.title-dot')).toHaveText('.');
  await expect(page.getByRole('status')).toHaveText('Online');
  await expect(page.getByLabel('Playing as')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Room', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join Room', exact: true })).toBeVisible();
}
export default {
  id: 'scopa', env: 'SCOPA_URL', url: process.env.SCOPA_URL || 'http://localhost:8082',
  scenes: [
    { id: 'landing', viewport: 'desktop', path: './', capture: landing, output: 'landing.webp' },
    { id: 'landing-mobile', viewport: 'mobile', path: './', capture: landing, output: 'landing-mobile.webp' },
  ],
};
