import { test, expect } from '@playwright/test';

// E2E: Recently Viewed widget appears after viewing a content

test('recently viewed widget shows after opening quick view', async ({ page }) => {
  // Precondition: same flow as quick view to ensure there is content saved
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Cài đặt' })).toBeVisible();
  await page.getByRole('tab', { name: 'Dự án' }).click();
  await page.getByRole('button', { name: 'Tạo dự án mới' }).click();
  await page.getByRole('heading', { name: 'Tạo dự án mới' }).isVisible();
  await page.getByLabel('Tên dự án *').fill('E2E Recent');
  await page.getByRole('button', { name: 'Tạo dự án' }).click();
  await expect(page.getByText('Đang sử dụng')).toBeVisible();

  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Tạo nội dung nhanh' })).toBeVisible();
  await page.getByRole('button', { name: /Tạo Nội Dung SEO|Đang tạo nội dung/i }).click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
  await page.getByRole('button', { name: /Lưu nội dung|Đang lưu/i }).click();
  await expect(page.getByTestId('toast-data-save-success')).toBeVisible();

  await page.getByRole('tab', { name: 'Thư viện' }).click();
  const openBtns = page.locator('[data-testid^="open-quick-view-"]');
  await expect(openBtns.first()).toBeVisible();
  await openBtns.first().click();
  await expect(page.getByTestId('quick-view-dialog')).toBeVisible();

  // Close dialog then go back to overview to see widget
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('quick-view-dialog')).toBeHidden({ timeout: 10000 });
  await page.getByRole('tab', { name: 'Tổng quan' }).click();
  await expect(page.getByTestId('recently-viewed-card')).toBeVisible();
});
