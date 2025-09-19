import { test, expect } from '@playwright/test';

// E2E: Outline -> Generate flow
// Steps: create project, add outline items, generate from outline, preview shows H2 with custom headings

test('generate content from custom outline', async ({ page }) => {
  // Create/select project via settings
  await page.goto('/settings');
  await page.getByRole('tab', { name: 'Dự án' }).click();
  const existsUsing = await page.getByText('Đang sử dụng').isVisible().catch(() => false);
  if (!existsUsing) {
    await page.getByRole('button', { name: 'Tạo dự án mới' }).click();
    await page.getByLabel('Tên dự án *').fill('Outline Project');
    await page.getByRole('button', { name: 'Tạo dự án' }).click();
    await expect(page.getByText('Đang sử dụng')).toBeVisible();
  }

  // Go to dashboard and open generator
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Tạo nội dung nhanh' })).toBeVisible();

  // Type title
  await page.getByLabel('Tiêu đề / Từ khóa chính').fill('Hướng dẫn tối ưu SEO landing page');

  // Use outline editor
  await page.getByTestId('outline-editor').scrollIntoViewIfNeeded();
  await page.getByTestId('outline-input').fill('Nghiên cứu từ khóa');
  await page.getByTestId('outline-add-btn').click();
  await page.getByTestId('outline-input').fill('Cấu trúc nội dung & CTA');
  await page.getByTestId('outline-add-btn').click();

  // Generate from outline
  await page.getByTestId('generate-from-outline').click();

  // Wait preview
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
  // Verify custom H2s appear
  await expect(page.locator('.prose h2', { hasText: 'Nghiên cứu từ khóa' }).first()).toBeVisible();
  await expect(page.locator('.prose h2', { hasText: 'Cấu trúc nội dung' }).first()).toBeVisible();
});
