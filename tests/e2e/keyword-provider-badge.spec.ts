import { test, expect } from '@playwright/test';

// Kiểm tra hiển thị provider badge trong Keyword Research
// Case 1: Mặc định (không có SERPAPI_API_KEY) => Provider: Mock
// Case 2: Có SERPAPI_API_KEY trong localStorage => Provider: SerpApi

test.describe('Keyword Research Provider Badge', () => {
  test('shows Mock provider by default', async ({ page }) => {
    await page.goto('/keyword-research');
    const badge = page.getByTestId('provider-badge');
    await expect(badge).toHaveText(/Provider: Mock/i);
  });

  test('shows SerpApi provider when key is present', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('SERPAPI_API_KEY', 'dummy');
    });
    await page.goto('/keyword-research');
    const badge = page.getByTestId('provider-badge');
    await expect(badge).toHaveText(/Provider: SerpApi/i);
  });
});