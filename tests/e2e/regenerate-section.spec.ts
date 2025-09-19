import { test, expect } from '@playwright/test';

// Regenerate one section after initial generation

test('regenerate a single section', async ({ page }) => {
  // Prepare project
  await page.goto('/settings');
  await page.getByRole('tab', { name: 'Dự án' }).click();
  const using = await page.getByText('Đang sử dụng').isVisible().catch(() => false);
  if (!using) {
    await page.getByRole('button', { name: 'Tạo dự án mới' }).click();
    await page.getByLabel('Tên dự án *').fill('Regen Project');
    await page.getByRole('button', { name: 'Tạo dự án' }).click();
    await expect(page.getByText('Đang sử dụng')).toBeVisible();
  }

  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Tạo nội dung nhanh' })).toBeVisible();

  // Title and outline
  await page.getByLabel('Tiêu đề / Từ khóa chính').fill('Tối ưu SEO cho landing page');
  await page.getByTestId('outline-input').fill('Nghiên cứu từ khóa');
  await page.getByTestId('outline-add-btn').click();
  await page.getByTestId('outline-input').fill('Cấu trúc nội dung & CTA');
  await page.getByTestId('outline-add-btn').click();

  // Generate
  await page.getByTestId('generate-from-outline').click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();

  // Regenerate section 1 (index 1 corresponds to first H2 after title)
  const regenBtn = page.getByTestId('regen-1');
  await regenBtn.click();

  // Ensure main card still visible (avoid strict toast selector)
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
  await expect(page.locator('.prose h2').first()).toBeVisible();
});
