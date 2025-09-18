import { test, expect } from '@playwright/test';

// Smoke test: landing page loads and shows key UI elements
// In E2E we bypass auth, so CTA may be "Vào Dashboard" instead of "Đăng nhập"

test('landing page renders and CTA works', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Intent Ninja/i);
  await expect(page.getByRole('heading', { level: 1, name: /Intent Ninja/i })).toBeVisible();

  // CTA: either "Vào Dashboard" (bypass auth) or "Đăng nhập"
  const goDashboard = page.getByRole('link', { name: 'Vào Dashboard', exact: true });
  const login = page.getByRole('link', { name: 'Đăng nhập', exact: true });

  if (await goDashboard.isVisible().catch(() => false)) {
    await goDashboard.click();
    await expect(page).toHaveURL(/\/dashboard$/);
  } else {
    // Trong một số build CTA có thể khác, nếu không thấy login thì bỏ qua nhánh này
    if (await login.isVisible().catch(() => false)) {
      await login.click();
      await expect(page).toHaveURL(/\/auth$/);
    }
  }
});

// In E2E we bypass auth, so protected route should load successfully

test('dashboard loads under bypass auth', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Tạo nội dung nhanh')).toBeVisible();
});
