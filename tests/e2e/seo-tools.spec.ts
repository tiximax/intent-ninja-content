import { test, expect } from '@playwright/test';

// E2E for SeoTools tabs: SERP Analysis, Backlink Analysis, Content Optimization (mock behaviors)

test('SERP Analysis: run mock analysis and see results', async ({ page }) => {
  await page.goto('/seo-tools');

  // Switch to SERP Analysis tab
  await page.getByRole('tab', { name: 'SERP Analysis' }).click();

  const input = page.getByPlaceholder('Nhập từ khóa để phân tích SERP...');
  await expect(input).toBeVisible();
  await input.fill('seo');

  await page.getByRole('button', { name: 'Phân tích SERP' }).click();

  // Wait for results tabs to appear
  await expect(page.getByRole('tab', { name: 'Search Results' })).toBeVisible();
  await page.getByRole('tab', { name: 'Search Results' }).click();

  // Expect at least a ranking badge like #1, #2...
  await expect(page.getByText('#1').first()).toBeVisible();
});


test('Backlink Analysis: run mock analysis and see stats', async ({ page }) => {
  await page.goto('/seo-tools');

  // Switch to Backlink Analysis tab
  await page.getByRole('tab', { name: 'Backlink Analysis' }).click();

  const input = page.getByPlaceholder('Nhập URL website để phân tích backlinks...');
  await expect(input).toBeVisible();
  await input.fill('https://example.com');

  await page.getByRole('button', { name: /^Phân tích$/ }).click();

  // Expect overview stats to appear (e.g., Total Backlinks)
  await expect(page.getByText('Total Backlinks')).toBeVisible();
});


test('Content Optimization: analyze sample content and see overview', async ({ page }) => {
  await page.goto('/seo-tools');

  // Switch to Content Optimization tab
  await page.getByRole('tab', { name: 'Content Optimization' }).click();

  // Fill keyword and content
  // Một số component có thể không có label chuẩn, fallback sang selector khác ổn định.
  const keywordInput = page.locator('input').nth(0);
  await expect(keywordInput).toBeVisible();
  await keywordInput.fill('seo');

  const contentTextarea = page.getByRole('textbox').last();
  await expect(contentTextarea).toBeVisible();
  await contentTextarea.fill('# Tiêu đề\nNội dung SEO test.');

  await page.getByRole('button', { name: 'Phân tích nội dung' }).click();

  // Wait for overview tab exists
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
});
