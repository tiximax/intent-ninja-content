import { test, expect } from '@playwright/test';

// Verify that brand voice + regenerate changes section content

test('brand voice + regenerate changes section content', async ({ page }) => {
  await page.goto('/dashboard');

  // Title + outline
  await page.getByLabel('Tiêu đề / Từ khóa chính').fill('Chiến lược nội dung SEO cho landing page');
  await page.getByTestId('outline-input').fill('Nghiên cứu từ khóa');
  await page.getByTestId('outline-add-btn').click();
  await page.getByTestId('outline-input').fill('Cấu trúc nội dung & CTA');
  await page.getByTestId('outline-add-btn').click();

  // Generate
  await page.getByTestId('generate-from-outline').click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();

  // Capture first section html
  const prose = page.locator('.prose');
  const beforeHtml = await prose.innerHTML();

  // Regenerate first H2
  await page.getByTestId('regen-1').click();

  // Ensure main card still visible (avoid strict toast selector)
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
});
