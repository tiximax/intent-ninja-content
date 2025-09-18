import { test, expect } from '@playwright/test';

// Test live SerpApi integration - chỉ chạy khi có flag
test('live serpapi-keywords returns data from edge function', async () => {
  if (process.env.RUN_LIVE_SERPAPI !== 'true') {
    test.skip(true, 'RUN_LIVE_SERPAPI is not true; skipping live serpapi test');
  }
  
  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    test.skip(true, 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  }

  const endpoint = `${url!.replace(/\/$/, '')}/functions/v1/serpapi-keywords`;
  const body = {
    seedKeyword: 'SEO tools',
    options: {
      language: 'vi',
      location: 'VN'
    }
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
  
  // Kiểm tra structure
  expect(data).toBeDefined();
  expect(Array.isArray(data.keywords)).toBeTruthy();
  expect(Array.isArray(data.trends)).toBeTruthy();
  expect(data.keywords.length).toBeGreaterThan(0);
  
  // Kiểm tra keyword structure
  const firstKeyword = data.keywords[0];
  expect(firstKeyword.keyword).toBeTruthy();
  expect(typeof firstKeyword.searchVolume).toBe('number');
  expect(typeof firstKeyword.difficulty).toBe('number');
  
  console.log(`SerpApi Live Test: Found ${data.keywords.length} keywords, first: "${firstKeyword.keyword}"`);
});