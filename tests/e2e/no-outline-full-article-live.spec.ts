import { test, expect } from '@playwright/test';

// Live integration: no-outline → article with paragraphs
// Skipped by default. To run:
// RUN_LIVE_GEN=true VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npx playwright test tests/e2e/no-outline-full-article-live.spec.ts --config=playwright.live.config.ts

test('live generate-content with empty outline returns full article (has paragraphs)', async () => {
  if (process.env.RUN_LIVE_GEN !== 'true') {
    test.skip(true, 'RUN_LIVE_GEN is not true; skipping live integration test');
  }
  const rawUrl = process.env.VITE_SUPABASE_URL || '';
  const rawAnon = process.env.VITE_SUPABASE_ANON_KEY || '';
  const url = rawUrl.replace(/[{}]/g, '');
  const anon = rawAnon.replace(/[{}]/g, '');
  if (!url || !anon) {
    test.skip(true, 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  }

  const endpoint = `${url!.replace(/\/$/, '')}/functions/v1/generate-content`;
  const body = {
    title: 'E2E Live - Không outline phải ra bài viết đầy đủ',
    keywords: ['seo', 'viết bài chuẩn seo'],
    language: 'vi',
    tone: 'professional',
    wordCount: 600,
    outline: [],
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anon}`,
    },
    body: JSON.stringify(body),
  });
  expect(res.ok).toBeTruthy();

  const data = await res.json();
  expect(data).toMatchObject({ success: true });
  const html: string = String(data?.content?.content || '');

  // Expect to see multiple paragraphs
  const pCount = (html.match(/<p>/gi) || []).length;
  expect(pCount).toBeGreaterThanOrEqual(2);

  // Also ensure not only a list of headings
  const h2Count = (html.match(/<h2/gi) || []).length;
  expect(h2Count).toBeGreaterThanOrEqual(1);
});
