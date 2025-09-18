import { test, expect } from '@playwright/test';

// Live integration test for generate-content Edge Function using Gemini.
// Skips by default. To run, ensure server uses Gemini (either only GEMINI_API_KEY is set
// or CONTENT_MODEL begins with "gemini:") and run:
// RUN_LIVE_GEMINI=true VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npx playwright test tests/e2e/generate-content-gemini-live.spec.ts

test('live generate-content (Gemini) returns JSON success', async () => {
  if (process.env.RUN_LIVE_GEMINI !== 'true') {
    test.skip(true, 'RUN_LIVE_GEMINI is not true; skipping Gemini live test');
  }
  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    test.skip(true, 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  }

  const endpoint = `${url!.replace(/\/$/, '')}/functions/v1/generate-content`;
  const body = {
    title: 'Gemini Live Test - Nội dung SEO',
    keywords: ['seo', 'gemini'],
    language: 'vi',
    tone: 'professional',
    wordCount: 300,
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
  expect(data.content?.title).toBeTruthy();
  expect(typeof data.content?.seoScore).toBe('number');
});
