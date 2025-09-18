import { test, expect } from '@playwright/test';

// Settings page should load under bypass auth

test('settings loads under bypass auth', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Cài đặt' })).toBeVisible();
});
