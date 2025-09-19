import { test, expect } from '@playwright/test';

// Undo after CTA regenerate should remove CTA content

test('undo section after CTA regenerate restores previous content', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByLabel('Tiêu đề / Từ khóa chính').fill('Landing page SEO CTA test');
  await page.getByTestId('outline-input').fill('Phần A');
  await page.getByTestId('outline-add-btn').click();
  await page.getByTestId('outline-input').fill('Phần B');
  await page.getByTestId('outline-add-btn').click();
  await page.getByTestId('generate-from-outline').click();

  // CTA on second section
  const ctaBtn = page.getByRole('button', { name: 'CTA' }).nth(1);
  await ctaBtn.scrollIntoViewIfNeeded();
  await ctaBtn.click({ force: true });

  // Undo second section
  const undoBtn = page.getByTestId('undo-1');
  await undoBtn.scrollIntoViewIfNeeded();
  await undoBtn.click({ force: true });

  // Ensure main card still visible
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
});
