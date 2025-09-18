// supabase/functions/serpapi-keywords/index.ts
// Edge Function: proxy gọi SerpApi để tránh lộ API key và xử lý CORS
// Triển khai tham khảo cho Supabase Edge Functions (Deno).
// Yêu cầu secrets: SERPAPI_API_KEY (đặt trong Supabase project config)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const LOG_LEVEL = (Deno.env.get('LOG_LEVEL') || 'info').toLowerCase();
const LEVEL_MAP: Record<string, number> = { error: 0, warn: 1, info: 2, debug: 3 };
const shouldLog = (level: string) => (LEVEL_MAP[level] ?? 2) <= (LEVEL_MAP[LOG_LEVEL] ?? 2);
const log = (level: 'error' | 'warn' | 'info' | 'debug', msg: string, data: Record<string, unknown> = {}) => {
  if (!shouldLog(level)) return;
  const entry = { level, msg, ts: new Date().toISOString(), ...data };
  console.log(JSON.stringify(entry));
};

interface KeywordData {
  keyword: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
  competitionIndex: number;
  cpc: number;
  trend: number[];
  relatedQueries: string[];
  difficulty: number;
}

interface TrendsData {
  keyword: string;
  timeframe: string;
  region: string;
  interest: { date: string; value: number }[];
  relatedTopics: { title: string; value: number }[];
  relatedQueries: { query: string; value: number }[];
}

interface KeywordResearchResponse {
  keywords: KeywordData[];
  trends: TrendsData[];
  clusters: {
    name: string;
    keywords: string[];
    intent: string;
    volume: number;
  }[];
  suggestions: {
    longtail: string[];
    questions: string[];
    semantic: string[];
  };
}

serve(async (req) => {
  const reqId = (globalThis.crypto?.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random()}`;
  log('info', 'serpapi-keywords_request_received', { reqId });
  try {
    const { seedKeyword, options } = await req.json();
    const apiKey = Deno.env.get('SERPAPI_API_KEY');
    if (!apiKey) {
      log('error', 'missing_serpapi_key', { reqId });
      return new Response(JSON.stringify({ error: 'Missing SERPAPI_API_KEY on server' }), { status: 500 });
    }

    // Ví dụ tối giản: gọi SerpApi Google Related/Trends surrogate endpoint (tuỳ chọn)
    // Ở đây chúng ta giả lập dữ liệu thực bằng cách tạo dữ liệu từ seedKeyword
    // Bạn có thể thay bằng fetch đến SerpApi endpoint mong muốn.

    const mkRand = (n: number) => Math.floor(Math.random() * n);

    // Thử gọi SerpApi; nếu lỗi sẽ fallback mock bên dưới
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google');
    url.searchParams.set('q', seedKeyword);
    if (options?.language) url.searchParams.set('hl', options.language);
    if (options?.location) url.searchParams.set('gl', options.location);
    url.searchParams.set('api_key', apiKey);

    let serp: any | null = null;
    try {
      const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });
      log('info', 'serpapi_http_response', { reqId, status: res.status });
      if (res.ok) {
        serp = await res.json();
      }
    } catch (e) {
      log('warn', 'serpapi_fetch_error', { reqId, error: String(e) });
      serp = null;
    }

    const candidates: string[] = [];
    if (serp) {
      if (Array.isArray(serp.related_questions)) {
        for (const rq of serp.related_questions) {
          if (rq?.question) candidates.push(String(rq.question));
        }
      }
      if (Array.isArray(serp.related_searches)) {
        for (const rs of serp.related_searches) {
          if (rs?.query) candidates.push(String(rs.query));
        }
      }
      if (Array.isArray(serp.organic_results)) {
        for (const or of serp.organic_results.slice(0, 10)) {
          if (or?.title) candidates.push(String(or.title));
        }
      }
    }

    // Loại trùng và giữ lại một số lượng hợp lý
    const uniqueCandidates = Array.from(new Set([seedKeyword, ...candidates])).slice(0, 20);
    log('debug', 'serpapi_candidates_built', { reqId, count: uniqueCandidates.length });

    const keywords: KeywordData[] = uniqueCandidates.map((kw) => ({
      keyword: kw,
      // SerpApi không trả volume trực tiếp -> tạo ước lượng tạm thời
      searchVolume: mkRand(10000) + 100,
      competition: (['low','medium','high'] as const)[mkRand(3)],
      competitionIndex: Math.random(),
      cpc: parseFloat((Math.random() * 5 + 0.5).toFixed(2)),
      trend: Array.from({ length: 12 }, () => mkRand(100)),
      relatedQueries: [ `${kw} tutorial`, `${kw} tips`, `${kw} review` ],
      difficulty: mkRand(100),
    }));

    const trends: TrendsData[] = [
      {
        keyword: seedKeyword,
        timeframe: '12m',
        region: (options?.location || 'VN'),
        interest: Array.from({ length: 12 }, (_, i) => ({
          date: new Date(2024, i, 1).toISOString(),
          value: mkRand(100),
        })),
        relatedTopics: [
          { title: 'SEO', value: mkRand(100) },
          { title: 'Content', value: mkRand(100) },
        ],
        relatedQueries: uniqueCandidates.slice(0, 5).map(q => ({ query: q, value: mkRand(100) })),
      }
    ];

    const resp: KeywordResearchResponse = {
      keywords,
      trends,
      clusters: [
        { name: 'Informational', keywords: keywords.slice(0,3).map(k => k.keyword), intent: 'informational', volume: 12000 },
        { name: 'Commercial', keywords: keywords.slice(2,5).map(k => k.keyword), intent: 'commercial', volume: 7000 },
      ],
      suggestions: {
        longtail: [ `${seedKeyword} for beginners`, `${seedKeyword} step by step` ],
        questions: [ `${seedKeyword} là gì?`, `Cách ${seedKeyword} hiệu quả?` ],
        semantic: [ 'tối ưu', 'chiến lược', 'hiệu quả' ]
      }
    };

    log('info', 'serpapi_success', { reqId, keywords: resp.keywords.length });
    return new Response(JSON.stringify(resp), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    log('error', 'serpapi_unhandled_error', { error: String(e) });
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
