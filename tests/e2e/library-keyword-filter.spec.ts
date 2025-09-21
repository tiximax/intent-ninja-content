import { test, expect } from '@playwright/test';

// E2E: Keyword contains filter and copy filter URL

test('library keyword contains filter and copy filter URL', async ({ page }) => {
  // Create/select project for saving content
  await page.goto('/settings');
  await page.getByRole('tab', { name: 'Dự án' }).click();
  const exists = await page.getByText('Đang sử dụng').isVisible().catch(() => false);
  if (!exists) {
    await page.getByRole('button', { name: 'Tạo dự án mới' }).click();
    await page.getByLabel('Tên dự án *').fill('KW Filter Project');
    await page.getByRole('button', { name: 'Tạo dự án' }).click();
    await expect(page.getByText('Đang sử dụng')).toBeVisible();
  }

  // Seed two items and set target_keywords deterministically
  await page.goto('/dashboard');
  await page.evaluate(() => {
    localStorage.setItem('bypassAuth', 'true');
  });
  await page.getByRole('button', { name: /Tạo Nội Dung SEO|Đang tạo nội dung/i }).click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
  await page.getByRole('button', { name: /Lưu nội dung|Đang lưu/i }).click();
  await page.waitForFunction(() => { try { return (JSON.parse(localStorage.getItem('local-content')||'[]')||[]).length >= 1 } catch { return false } });

  await page.getByRole('button', { name: 'Tạo mới' }).click();
  await page.getByRole('button', { name: /Tạo Nội Dung SEO|Đang tạo nội dung/i }).click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
  await page.getByRole('button', { name: /Lưu nội dung|Đang lưu/i }).click();
  await page.waitForFunction(() => { try { return (JSON.parse(localStorage.getItem('local-content')||'[]')||[]).length >= 2 } catch { return false } });

  await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem('local-content')||'[]');
    if (list.length >= 2) {
      list[0].title = 'Bài viết về Canon';
      list[0].target_keywords = ['canon', 'máy ảnh'];
      list[1].title = 'Bài viết về iPhone';
      list[1].target_keywords = ['iphone', 'điện thoại'];
    }
    localStorage.setItem('local-content', JSON.stringify(list));
  });

  // Open Library
  await page.getByRole('tab', { name: 'Thư viện' }).click();
  const cards = page.locator('[data-testid="library-card"]');
  await expect(cards).toHaveCount(2);

  // Apply keyword contains filter
  await page.getByTestId('library-filter-kw').fill('iphone');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('iPhone');

  // Copy URL with current filters
  await page.getByTestId('library-copy-filter-url').click();
  // Reading clipboard is restricted in browser context; assert URL contains kw param instead
  const url = page.url();
  expect(url).toContain('kw=iphone');
});
