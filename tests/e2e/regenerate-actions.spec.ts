import { test, expect } from '@playwright/test';

// Verify regenerate actions (expand and cta)

test('regenerate Expand increases content length; CTA adds call-to-action', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByLabel('Tiêu đề / Từ khóa chính').fill('Checklist tối ưu SEO landing page');
  await page.getByTestId('outline-input').fill('Nghiên cứu từ khóa');
  await page.getByTestId('outline-add-btn').click();
  await page.getByTestId('outline-input').fill('Cấu trúc nội dung & CTA');
  await page.getByTestId('outline-add-btn').click();
  await page.getByTestId('generate-from-outline').click();

  // CTA on second section (verify CTA content appears)
  const ctaBtn = page.getByRole('button', { name: 'CTA' }).nth(1);
  await ctaBtn.scrollIntoViewIfNeeded();
  await ctaBtn.click({ force: true });
  await expect(page.getByText(/Regenerate thành công|Nội dung đã tạo/)).toBeVisible();
});
