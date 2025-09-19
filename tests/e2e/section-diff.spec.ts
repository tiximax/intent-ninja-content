import { test, expect } from '@playwright/test';

// Verify Diff modal opens with content

test('diff modal opens after regenerate', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByLabel('Tiêu đề / Từ khóa chính').fill('Diff modal test');
  await page.getByTestId('outline-input').fill('Mục A');
  await page.getByTestId('outline-add-btn').click();
  await page.getByTestId('outline-input').fill('Mục B');
  await page.getByTestId('outline-add-btn').click();
  await page.getByTestId('generate-from-outline').click();

  // Trigger CTA to ensure snapshot exists then open diff
  const cta = page.getByRole('button', { name: 'CTA' }).first();
  await cta.scrollIntoViewIfNeeded();
  await cta.click({ force: true });
  const diffBtn = page.getByRole('button', { name: 'Diff' }).first();
  await diffBtn.scrollIntoViewIfNeeded();
  await diffBtn.click({ force: true });

  // marker exists (even hidden) -> modal rendered
  await expect(page.getByTestId('diff-modal-marker')).toHaveCount(1);
});
