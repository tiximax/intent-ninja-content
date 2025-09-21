import { test, expect } from '@playwright/test';

// E2E: Content Library Smart Filters (project, date, score, word count, TOC/FAQ)

test('library filters: project/date/score/words/toggles', async ({ page }) => {
  // Setup project and two saved items
  await page.goto('/settings');
  await page.getByRole('tab', { name: 'Dự án' }).click();
  const exists = await page.getByText('Đang sử dụng').isVisible().catch(() => false);
  if (!exists) {
    await page.getByRole('button', { name: 'Tạo dự án mới' }).click();
    await page.getByLabel('Tên dự án *').fill('Filters Project');
    await page.getByRole('button', { name: 'Tạo dự án' }).click();
    await expect(page.getByText('Đang sử dụng')).toBeVisible();
  }

  // Create two contents via dashboard quick button
  await page.goto('/dashboard');
  await page.getByRole('button', { name: /Tạo Nội Dung SEO|Đang tạo nội dung/i }).click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
  await page.getByRole('button', { name: /Lưu nội dung|Đang lưu/i }).click();
  await page.waitForFunction(() => { try { return (JSON.parse(localStorage.getItem('local-content')||'[]')||[]).length >= 1 } catch { return false } });

  await page.getByRole('button', { name: 'Tạo mới' }).click();
  await page.getByRole('button', { name: /Tạo Nội Dung SEO|Đang tạo nội dung/i }).click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
  await page.getByRole('button', { name: /Lưu nội dung|Đang lưu/i }).click();
  await page.waitForFunction(() => { try { return (JSON.parse(localStorage.getItem('local-content')||'[]')||[]).length >= 2 } catch { return false } });

  // Mutate local-content to craft deterministic attributes
  await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem('local-content')||'[]');
    if (list.length >= 2) {
      // First: older date, low score, few words, no TOC/FAQ
      list[0].seo_score = 60;
      list[0].updated_at = '2024-01-01T00:00:00.000Z';
      list[0].content_body = '<h1>A</h1><p>'+('word '.repeat(50))+'</p>';
      // Second: recent date, high score, many words, include TOC+FAQ
      list[1].seo_score = 95;
      list[1].updated_at = new Date().toISOString();
      list[1].content_body = '<h1>B</h1><h2 id="muc-luc">Mục lục</h2><ul><li>1</li></ul><p>'+('word '.repeat(500))+'</p><h2>FAQ</h2><p><strong>1.</strong> Q?</p><p>A.</p>';
    }
    localStorage.setItem('local-content', JSON.stringify(list));
  });

  // Open library tab
  await page.getByRole('tab', { name: 'Thư viện' }).click();
  await expect(page.getByRole('heading', { name: 'Thư viện nội dung' })).toBeVisible();

  // Ensure both cards visible initially
  const cards = page.locator('[data-testid="library-card"]');
  await expect(cards).toHaveCount(2);

  // Filter by SEO minScore >= 90 → expect only high score item
  await page.getByTestId('library-filter-minscore').fill('90');
  await expect(cards).toHaveCount(1);

  // Clear, then filter by words min >= 200 → only the long one remains
  await page.getByTestId('library-filter-clear').click();
  await expect(cards).toHaveCount(2);
  await page.getByTestId('library-filter-minwords').fill('200');
  await expect(cards).toHaveCount(1);

  // Clear, then TOC toggle → only item with TOC remains
  await page.getByTestId('library-filter-clear').click();
  await expect(cards).toHaveCount(2);
  await page.getByTestId('library-filter-toc').click();
  await expect(cards).toHaveCount(1);

  // Clear, filter by date from today-1d to today+1d → only recent item
  await page.getByTestId('library-filter-clear').click();
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24*60*60*1000);
  const y = yesterday.toISOString().slice(0,10);
  const t = today.toISOString().slice(0,10);
  await page.getByTestId('library-filter-from').fill(y);
  await page.getByTestId('library-filter-to').fill(t);
  await expect(cards).toHaveCount(1);
});
