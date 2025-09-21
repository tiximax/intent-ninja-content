import { test, expect } from '@playwright/test';

// E2E: SEO Meta & Schema card shows meta snippet and JSON-LD Article/FAQ after generation (mock mode)

test('SEO Meta & Schema renders meta snippet and JSON-LD', async ({ page }) => {
  await page.goto('/dashboard');

  // Use the dashboard hero button that switches to results view
  await page.getByRole('button', { name: 'Tạo Nội Dung SEO' }).click();

  // Wait for results and the SEO Meta & Schema card
  const metaCard = page.getByTestId('seo-meta-schema');
  await expect(metaCard).toBeVisible({ timeout: 15000 });

  // Check meta snippet textarea includes title and description tags
  const metaText = await metaCard.locator('textarea').first().inputValue();
  expect(metaText).toMatch(/<title>.*<\/title>/);
  expect(metaText).toMatch(/<meta name=\"description\"/);
  expect(metaText).toMatch(/og:title/);
  expect(metaText).toMatch(/twitter:card/);

  // Check JSON-LD textarea contains schema.org Article
  const jsonLdText = await metaCard.locator('textarea').nth(1).inputValue();
  expect(jsonLdText).toContain('"@context": "https://schema.org"');
  expect(jsonLdText).toContain('"@type": "Article"');
});
