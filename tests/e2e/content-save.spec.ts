import { test, expect } from '@playwright/test';

// E2E: tạo project, generate content (mock), lưu content thành công.
// Playwright config bật VITE_BYPASS_AUTH và VITE_E2E_TEST_MODE nên không cần đăng nhập thật.

test('create project, generate mock content and save', async ({ page }) => {
// Vào settings để tạo project
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Cài đặt' })).toBeVisible();

  // Chuyển sang tab "Dự án"
  await page.getByRole('tab', { name: 'Dự án' }).click();

  // Mở dialog tạo dự án
  await page.getByRole('button', { name: 'Tạo dự án mới' }).click();
  await page.getByRole('heading', { name: 'Tạo dự án mới' }).isVisible();

  const nameInput = page.getByLabel('Tên dự án *');
  await nameInput.fill('E2E Project');
  await page.getByRole('button', { name: 'Tạo dự án' }).click();

  // Badge “Đang sử dụng” hoặc selector hiện project
  await expect(page.getByText('Đang sử dụng')).toBeVisible();

  // Vào Dashboard và generate
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Tạo nội dung nhanh' })).toBeVisible();

  // Nhấn tạo nhanh (không cần điền form vì có xử lý mặc định)
  const generateBtn = page.getByRole('button', { name: /Tạo Nội Dung SEO|Đang tạo nội dung/i });
  await generateBtn.click();

  // Kết quả hiển thị: thẻ “Nội dung đã tạo” + SEO Score (chọn locator ổn định)
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
  // Một số layout có thể không render text "SEO Score:" đúng chữ (ví dụ dùng Badge). Kiểm tra badge tổng thể.
  // Lấy badge điểm SEO ổn định bằng selector trong SeoScoreCard
  const overallScore = page.locator('div').filter({ hasText: /\d{1,3}\s*\/?\s*100/ }).first();
  await expect(overallScore).toBeVisible();

  // Lưu nội dung
  const saveBtn = page.getByRole('button', { name: /Lưu nội dung|Đang lưu/i });
  await saveBtn.click();

  // Toast thành công
  await expect(page.getByText('Lưu nội dung thành công')).toBeVisible();
});
