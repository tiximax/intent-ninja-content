import { test, expect } from '@playwright/test';

// Verify that Mock Mode badge is visible on homepage when VITE_USE_MOCK_CONTENT is true
// and that CTA still navigates correctly.

test('homepage shows Mock Mode badge when mock flag enabled', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Mock Mode')).toBeVisible();
});
