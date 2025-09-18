import { test, expect } from '@playwright/test';

// Keyword Research page loads under bypass auth and can trigger search

test('keyword research renders and can trigger mock search', async ({ page }) => {
  await page.goto('/keyword-research');
  // Đợi input placeholder xuất hiện rồi thao tác
  const input = page.getByPlaceholder('Nhập từ khóa để nghiên cứu...');
  await expect(input).toBeVisible();
  await input.fill('seo');
  await page.getByRole('button', { name: /Research/i }).click();

  await expect(page.getByRole('tab', { name: 'Keywords' })).toBeVisible();
});
