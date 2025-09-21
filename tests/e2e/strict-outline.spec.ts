import { test, expect } from '@playwright/test';

// E2E: Strict Outline — ensure generated H2s match exactly the provided outline (no extra H2)

test('strict outline generates only the provided H2 headings', async ({ page }) => {
  // Ensure a project exists
  await page.goto('/settings');
  await page.getByRole('tab', { name: 'Dự án' }).click();
  const exists = await page.getByText('Đang sử dụng').isVisible().catch(() => false);
  if (!exists) {
    await page.getByRole('button', { name: 'Tạo dự án mới' }).click();
    await page.getByLabel('Tên dự án *').fill('Strict Outline Project');
    await page.getByRole('button', { name: 'Tạo dự án' }).click();
    await expect(page.getByText('Đang sử dụng')).toBeVisible();
  }

  // Go to dashboard
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Tạo nội dung nhanh' })).toBeVisible();

  // Fill title
  await page.getByLabel('Tiêu đề / Từ khóa chính').fill('Strict Outline Test Bài SEO');

  // Outline items
  const outline = ['Giới thiệu', 'Quy trình triển khai'];
  await page.getByTestId('outline-editor').scrollIntoViewIfNeeded();
  for (const item of outline) {
    await page.getByTestId('outline-input').fill(item);
    await page.getByTestId('outline-add-btn').click();
  }

  // Generate from outline (strict mode enabled in form submit)
  await page.getByTestId('generate-from-outline').click();

  // Wait for preview
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();

  // Collect H2 headings in the preview
  const h2Texts = await page.locator('.prose h2').allTextContents();
  const normalized = h2Texts.map(t => t.trim());

  // Expect EXACT match and count
  expect(normalized).toEqual(outline);
  expect(normalized).toHaveLength(outline.length);

  // Additionally ensure no common extras sneak in
  expect(normalized.some(t => /FAQ|Mục lục/i.test(t))).toBeFalsy();
});
