import { test, expect } from '@playwright/test';

// E2E: Global search filters library results by query using fuzzy logic

test('global search filters library results (fuzzy)', async ({ page }) => {
// Create project for saving content
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Cài đặt' })).toBeVisible();
  await page.getByRole('tab', { name: 'Dự án' }).click();
  await page.getByRole('button', { name: 'Tạo dự án mới' }).click();
  await page.getByRole('heading', { name: 'Tạo dự án mới' }).isVisible();
  await page.getByLabel('Tên dự án *').fill('E2E Search');
  await page.getByRole('button', { name: 'Tạo dự án' }).click();
  await expect(page.getByText('Đang sử dụng')).toBeVisible();

  // Prepare draft #1
  await page.goto('/dashboard');
  await page.evaluate(() => {
    const draft = {
      title: 'Máy ảnh Canon chuyên nghiệp',
      keywords: 'máy ảnh, canon, nhiếp ảnh',
      language: 'vi',
      tone: 'professional',
      wordCount: 800,
      outline: [],
      brandVoicePreset: 'professional',
      brandCustomStyle: '',
      sectionDepth: 'standard',
      industryPreset: 'general',
    };
    localStorage.setItem('content-generator-draft', JSON.stringify(draft));
    localStorage.setItem('bypassAuth', 'true');
  });
  // Generate #1
  const generateBtn = page.getByRole('button', { name: /Tạo Nội Dung SEO|Đang tạo nội dung/i });
  await generateBtn.click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
  await page.getByRole('button', { name: /Lưu nội dung|Đang lưu/i }).click();
await page.waitForFunction(() => {
    try { return (JSON.parse(localStorage.getItem('local-content') || '[]') || []).length >= 1 } catch { return false }
  });

  // Prepare draft #2
  await page.getByRole('button', { name: 'Tạo mới' }).click();
  await page.evaluate(() => {
    const draft = {
      title: 'Điện thoại iPhone tối ưu hiệu năng',
      keywords: 'iphone, điện thoại, ios',
      language: 'vi',
      tone: 'professional',
      wordCount: 800,
      outline: [],
      brandVoicePreset: 'professional',
      brandCustomStyle: '',
      sectionDepth: 'standard',
      industryPreset: 'general',
    };
    localStorage.setItem('content-generator-draft', JSON.stringify(draft));
  });
  await page.getByRole('button', { name: /Tạo Nội Dung SEO|Đang tạo nội dung/i }).click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
  await page.getByRole('button', { name: /Lưu nội dung|Đang lưu/i }).click();
  await page.waitForFunction(() => {
    try { return (JSON.parse(localStorage.getItem('local-content') || '[]') || []).length >= 2 } catch { return false }
  });

  // Open Library
  await page.getByRole('tab', { name: 'Thư viện' }).click();
  await expect(page.getByRole('heading', { name: 'Thư viện nội dung' })).toBeVisible();

  // Search for iPhone
  const input = page.getByTestId('library-search');
  await input.fill('iPhone');

  // Expect only items matching iPhone remain
  const cards = page.locator('[data-testid="library-card"]');
  await expect(cards).toHaveCount(1, { timeout: 10000 });
  await expect(cards.first()).toContainText('iPhone');
});
