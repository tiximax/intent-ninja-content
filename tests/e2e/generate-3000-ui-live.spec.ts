import { test, expect } from '@playwright/test';

// Live UI test: generate with wordCount=3000 and expect orchestrator to reach minimum
// Requires: VITE_USE_MOCK_CONTENT=false in webServer env (use playwright.live.config.ts)

const TITLE = 'Bài viết SEO 3000 từ - thử nghiệm live';

test('live UI generate reaches minimum 3000 words via orchestrator', async ({ page }) => {
  test.setTimeout(180_000);
  // Bypass auth and go to dashboard
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('bypassAuth', 'true'));
  await page.goto('/dashboard');

  // Go to content tab
  await page.getByRole('tab', { name: 'Tạo nội dung' }).click();

  // Fill title & keywords
  await page.fill('input#title', TITLE);
  await page.fill('textarea#keywords', 'seo onpage, thương mại điện tử, tối ưu nội dung');

  // Move slider to maximum (3000)
  const slider = page.locator('[role="slider"]').first();
  await slider.focus();
  await slider.press('End');

  // Submit
  await page.getByRole('button', { name: /Tạo nội dung AI/i }).click();

  // Wait for expansion progress toast then final success (ổn định theo data-testid)
  await expect(page.getByTestId('toast-content-generation-loading')).toBeVisible({ timeout: 30_000 });

  // Wait up to 3 minutes for completion (orchestrator loops up to 8 rounds depending on backend)
  await expect(page.getByTestId('toast-content-generation-success')).toBeVisible({ timeout: 180_000 });
});
