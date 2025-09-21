import { test, expect } from '@playwright/test';

// E2E UI: Generate without outline → should produce a full article (paragraphs), not just an outline.
// Runs in mock mode by default via playwright.config.ts

test('no-outline generation produces full article (mock mode)', async ({ page }) => {
  // Bypass auth (config also sets VITE_BYPASS_AUTH=true)
  await page.goto('/dashboard');

  // Ensure generator is visible
  await expect(page.getByTestId('content-generator-card')).toBeVisible();

  // Fill title only; leave outline empty
  await page.fill('input#title', 'Kiểm thử no-outline: bài viết đầy đủ');

  // Submit general generation (not from outline)
  await page.getByRole('button', { name: /Tạo nội dung AI/i }).click();

  // Wait for preview section
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();

  // Verify there are paragraphs (not just a list/outline)
  const paras = page.locator('.prose p');
  await expect(paras.first()).toBeVisible();
  const paraCount = await paras.count();
  expect(paraCount).toBeGreaterThanOrEqual(2);

  // Check one paragraph has meaningful length
  const firstText = (await paras.first().innerText()).trim();
  expect(firstText.length).toBeGreaterThan(50);

  // H2 sections should exist too
  expect(await page.locator('.prose h2').count()).toBeGreaterThanOrEqual(2);
});
