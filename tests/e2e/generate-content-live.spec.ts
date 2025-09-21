import { test, expect } from '@playwright/test';

// Live integration test for generate-content Edge Function.
// This test is skipped by default. To run:
// RUN_LIVE_GEN=true VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npx playwright test tests/e2e/generate-content-live.spec.ts

test('live generate-content returns JSON success', async () => {
  if (process.env.RUN_LIVE_GEN !== 'true') {
    test.skip(true, 'RUN_LIVE_GEN is not true; skipping live integration test');
  }
  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    test.skip(true, 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  }

  const endpoint = `${url!.replace(/\/$/, '')}/functions/v1/generate-content`;
  const body = {
    title: 'Kiểm thử E2E Live - Nội dung SEO',
    keywords: ['seo', 'playwright'],
    language: 'vi',
    tone: 'professional',
    wordCount: 300,
  };

  const reqId = 'e2e-live-request-id';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anon}`,
      'x-request-id': reqId,
    },
    body: JSON.stringify(body),
  });

  expect(res.ok).toBeTruthy();
  const data = await res.json();
  expect(data).toMatchObject({ success: true });
  expect(data.content?.title).toBeTruthy();
  expect(typeof data.content?.seoScore).toBe('number');
  // requestId passthrough assertion
  expect(typeof data.requestId).toBe('string');
  expect(data.requestId).toBe(reqId);
});
