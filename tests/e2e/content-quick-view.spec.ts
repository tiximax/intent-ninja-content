import { test, expect } from '@playwright/test';

// E2E: Quick View dialog in Content Library
// Flow: create project -> generate mock content -> save -> open Library -> open Quick View

test('content library quick view shows meta, snippet, actions', async ({ page }) => {
  // Create project
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Cài đặt' })).toBeVisible();
  await page.getByRole('tab', { name: 'Dự án' }).click();
  await page.getByRole('button', { name: 'Tạo dự án mới' }).click();
  await page.getByRole('heading', { name: 'Tạo dự án mới' }).isVisible();
  await page.getByLabel('Tên dự án *').fill('E2E QuickView');
  await page.getByRole('button', { name: 'Tạo dự án' }).click();
  await expect(page.getByText('Đang sử dụng')).toBeVisible();

  // Generate content quickly
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Tạo nội dung nhanh' })).toBeVisible();
  const generateBtn = page.getByRole('button', { name: /Tạo Nội Dung SEO|Đang tạo nội dung/i });
  await generateBtn.click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();

  // Save
  const saveBtn = page.getByRole('button', { name: /Lưu nội dung|Đang lưu/i });
  await saveBtn.click();
  await expect(page.getByTestId('toast-data-save-success')).toBeVisible();

  // Go Library
  await page.getByRole('tab', { name: 'Thư viện' }).click();
  await expect(page.getByRole('heading', { name: 'Thư viện nội dung' })).toBeVisible();

  // Open Quick View of first card
  const openBtns = page.locator('[data-testid^="open-quick-view-"]');
  await expect(openBtns.first()).toBeVisible();
  await openBtns.first().click();

  // Quick View dialog assertions
  const dialog = page.getByTestId('quick-view-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Meta Description')).toBeVisible();
  await expect(dialog.getByText('Tóm tắt')).toBeVisible();
  await expect(dialog.getByTestId('quick-view-copy')).toBeVisible();
  await expect(dialog.getByTestId('quick-view-export-html')).toBeVisible();
});
