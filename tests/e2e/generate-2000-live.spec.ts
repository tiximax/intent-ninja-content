import { test, expect } from '@playwright/test';

// Live integration test for 2000-word SEO article
// Skipped unless RUN_LIVE_GEN=true and VITE_SUPABASE_URL/ANON_KEY are provided.

function stripHtml(html: string) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

test('live generate-content 2000 words SEO (provider + structure + length)', async () => {
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
  const title = 'SEO cho kẹo hồng sâm Achimmadang 2000 từ';
  const body = {
    title,
    keywords: ['kẹo hồng sâm', 'Achimmadang'],
    language: 'vi',
    tone: 'professional',
    wordCount: 2000,
  };

  const reqId = 'e2e-2000-'+Date.now();
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

  const provider = String(data.providerUsed || 'fallback');
  // If backend is in fallback mode (no AI / provider errors), skip strict length check
  if (provider === 'fallback') {
    test.skip(true, 'Backend provider is in fallback mode; skipping strict 2000-word assertion');
  }

  // Provider should be real
  expect(['openai','gemini']).toContain(provider);

  // Basic SEO checks
  const meta: string = String(data?.content?.metaDescription || '');
  expect(meta.length).toBeLessThanOrEqual(160);

  const html: string = String(data?.content?.content || '');
  expect(html).toContain('<h1>');
  expect(/<h2\b/i.test(html)).toBeTruthy();

  const text = stripHtml(html);
  const wc = countWords(text);
  expect(wc).toBeGreaterThanOrEqual(1900); // allow small margin

  // Title keyword in first ~100 words
  const first100 = text.split(/\s+/).slice(0, 100).join(' ').toLowerCase();
  expect(first100.includes('kẹo')).toBeTruthy();
});
