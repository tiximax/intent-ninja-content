import { test, expect } from '@playwright/test';

// E2E: Compare 2 contents in Library

test('library compare shows table with at least 2 rows', async ({ page }) => {
  // Setup project
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Cài đặt' })).toBeVisible();
  await page.getByRole('tab', { name: 'Dự án' }).click();
  await page.getByRole('button', { name: 'Tạo dự án mới' }).click();
  await page.getByRole('heading', { name: 'Tạo dự án mới' }).isVisible();
  await page.getByLabel('Tên dự án *').fill('E2E Compare');
  await page.getByRole('button', { name: 'Tạo dự án' }).click();
  await expect(page.getByText('Đang sử dụng')).toBeVisible();

  // Generate + save #1
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Tạo nội dung nhanh' })).toBeVisible();
  await page.getByRole('button', { name: /Tạo Nội Dung SEO|Đang tạo nội dung/i }).click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
  await page.getByRole('button', { name: /Lưu nội dung|Đang lưu/i }).click();
  await expect(page.getByTestId('toast-data-save-success').first()).toBeVisible();

  // Generate + save #2
  await page.getByRole('button', { name: 'Tạo mới' }).click();
  await page.getByRole('button', { name: /Tạo Nội Dung SEO|Đang tạo nội dung/i }).click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
  await page.getByRole('button', { name: /Lưu nội dung|Đang lưu/i }).click();
await expect(page.getByTestId('toast-data-save-success').first()).toBeVisible();

  // Library
  await page.getByRole('tab', { name: 'Thư viện' }).click();
  await expect(page.getByRole('heading', { name: 'Thư viện nội dung' })).toBeVisible();

  // Select 2 items
  const selects = page.locator('[data-testid^="select-content-"]');
  await expect(selects.nth(0)).toBeVisible();
  await expect(selects.nth(1)).toBeVisible();
  await selects.nth(0).click();
  await selects.nth(1).click();

  // Open compare
  const compareBtn = page.getByTestId('compare-open');
  await expect(compareBtn).toBeEnabled();
  await compareBtn.click();

  // Verify dialog & rows
  const dialog = page.getByTestId('compare-dialog');
  await expect(dialog).toBeVisible();
  const rows = dialog.locator('[data-testid^="compare-row-"]');
  await expect(rows).toHaveCount(2);
  await expect(dialog.getByText('Số từ')).toBeVisible();
  await expect(dialog.getByText('H2')).toBeVisible();
  await expect(dialog.getByText('H3')).toBeVisible();
});