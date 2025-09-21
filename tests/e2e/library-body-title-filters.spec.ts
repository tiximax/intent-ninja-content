import { test, expect } from '@playwright/test';

// E2E: Content body contains filter + title-only search toggle

test('library filters: body contains + title-only search', async ({ page }) => {
  // Prepare two items with different titles and bodies
  await page.goto('/settings');
  await page.getByRole('tab', { name: 'Dự án' }).click();
  const exists = await page.getByText('Đang sử dụng').isVisible().catch(() => false);
  if (!exists) {
    await page.getByRole('button', { name: 'Tạo dự án mới' }).click();
    await page.getByLabel('Tên dự án *').fill('BodyTitle Filters Project');
    await page.getByRole('button', { name: 'Tạo dự án' }).click();
    await expect(page.getByText('Đang sử dụng')).toBeVisible();
  }

  await page.goto('/dashboard');
  await page.evaluate(() => localStorage.setItem('bypassAuth', 'true'));

  // Generate first
  await page.getByRole('button', { name: /Tạo Nội Dung SEO|Đang tạo nội dung/i }).click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
  await page.getByRole('button', { name: /Lưu nội dung|Đang lưu/i }).click();
  await page.waitForFunction(() => { try { return (JSON.parse(localStorage.getItem('local-content')||'[]')||[]).length >= 1 } catch { return false } });

  // Generate second
  await page.getByRole('button', { name: 'Tạo mới' }).click();
  await page.getByRole('button', { name: /Tạo Nội Dung SEO|Đang tạo nội dung/i }).click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
  await page.getByRole('button', { name: /Lưu nội dung|Đang lưu/i }).click();
  await page.waitForFunction(() => { try { return (JSON.parse(localStorage.getItem('local-content')||'[]')||[]).length >= 2 } catch { return false } });

  // Mutate to set titles and bodies deterministically
  await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem('local-content')||'[]');
    if (list.length >= 2) {
      list[0].title = 'Hướng dẫn Core Web Vitals';
      list[0].content_body = '<h1>Core Web Vitals</h1><p>Largest Contentful Paint (LCP) là chỉ số quan trọng.</p>';
      list[1].title = 'Máy ảnh Canon cho người mới';
      list[1].content_body = '<h1>Máy ảnh Canon</h1><p>Hướng dẫn chọn máy ảnh phù hợp.</p>';
    }
    localStorage.setItem('local-content', JSON.stringify(list));
  });

  // Open Library tab
  await page.getByRole('tab', { name: 'Thư viện' }).click();
  const cards = page.locator('[data-testid="library-card"]');
  await expect(cards).toHaveCount(2);

  // Filter by body contains "LCP" (should match first only)
  await page.getByTestId('library-filter-body').fill('LCP');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Core Web Vitals');

  // Clear body filter
  await page.getByTestId('library-filter-clear').click();
  await expect(cards).toHaveCount(2);

  // Title-only search for "Canon": should match the Canon item
  await page.getByTestId('library-filter-title-only').click();
  await page.getByTestId('library-search').fill('Canon');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Canon');
});
