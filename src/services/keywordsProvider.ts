// src/services/keywordsProvider.ts
// Provider cho Keyword Research: mock | serpapi (placeholder, fallback mock)

export type Competition = 'low' | 'medium' | 'high';

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  competition: Competition;
  competitionIndex: number;
  cpc: number;
  trend: number[];
  relatedQueries: string[];
  difficulty: number;
}

export interface TrendsData {
  keyword: string;
  timeframe: string;
  region: string;
  interest: { date: string; value: number }[];
  relatedTopics: { title: string; value: number }[];
  relatedQueries: { query: string; value: number }[];
}

export interface KeywordResearchResponse {
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

export function getProviderName(): 'mock' | 'serpapi' {
  try {
    const enableFlag = (typeof import.meta !== 'undefined' && String((import.meta as any).env?.VITE_ENABLE_SERPAPI_PROVIDER || '').toLowerCase() === 'true');
    const clientKey = (typeof window !== 'undefined') ? localStorage.getItem('SERPAPI_API_KEY') : undefined;
    if (enableFlag || (clientKey && clientKey.trim().length > 0)) {
      return 'serpapi';
    }
  } catch {
    // ignore
  }
  return 'mock';
}

export async function researchKeywordsProvider(seedKeyword: string, options?: any): Promise<KeywordResearchResponse> {
  const provider = getProviderName();

  if (provider === 'serpapi') {
    try {
      // Gọi qua Supabase Edge Function để tránh lộ API key & CORS
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('serpapi-keywords', {
        body: { seedKeyword, options }
      });
      if (error) throw error;
      if (!data) throw new Error('No data from serpapi-keywords function');
      // Kỳ vọng data theo KeywordResearchResponse
      return data as KeywordResearchResponse;
    } catch (e) {
      console.warn('SERPAPI via edge function failed, fallback to mock:', e);
      return generateMockKeywordData(seedKeyword, options);
    }
  }

  // Mặc định dùng mock
  return generateMockKeywordData(seedKeyword, options);
}

function generateMockKeywordData(seedKeyword: string, options?: any): KeywordResearchResponse {
  const baseKeywords = [
    seedKeyword,
    `${seedKeyword} 2024`,
    `cách ${seedKeyword}`,
    `hướng dẫn ${seedKeyword}`,
    `${seedKeyword} tốt nhất`,
    `${seedKeyword} miễn phí`,
    `${seedKeyword} là gì`,
    `${seedKeyword} hiệu quả`,
    `${seedKeyword} cho người mới`,
    `${seedKeyword} chuyên nghiệp`
  ];

  const keywords: KeywordData[] = baseKeywords.map((kw) => ({
    keyword: kw,
    searchVolume: Math.floor(Math.random() * 10000) + 100,
    competition: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
    competitionIndex: Number(Math.random().toFixed(2)),
    cpc: Number((Math.random() * 5 + 0.5).toFixed(2)),
    trend: Array.from({ length: 12 }, () => Math.floor(Math.random() * 100)),
    relatedQueries: [
      `${kw} tutorial`,
      `${kw} tips`,
      `${kw} guide`
    ],
    difficulty: Math.floor(Math.random() * 100)
  }));

  const clusters = [
    {
      name: 'Educational',
      keywords: keywords.filter(k => k.keyword.includes('cách') || k.keyword.includes('hướng dẫn')).map(k => k.keyword),
      intent: 'informational',
      volume: 15000
    },
    {
      name: 'Commercial',
      keywords: keywords.filter(k => k.keyword.includes('tốt nhất') || k.keyword.includes('chuyên nghiệp')).map(k => k.keyword),
      intent: 'commercial',
      volume: 8500
    }
  ];

  return {
    keywords,
    trends: [generateMockTrendsData(seedKeyword, '12m')],
    clusters,
    suggestions: {
      longtail: [
        `${seedKeyword} cho website thương mại điện tử`,
        `${seedKeyword} bằng tools miễn phí`,
        `${seedKeyword} hiệu quả năm 2024`
      ],
      questions: [
        `${seedKeyword} có khó không?`,
        `Nên bắt đầu ${seedKeyword} từ đâu?`,
        `${seedKeyword} mất bao lâu?`
      ],
      semantic: [
        'tối ưu hóa',
        'cải thiện',
        'phát triển',
        'nâng cao'
      ]
    }
  };
}

function generateMockTrendsData(keyword: string, timeframe: string): TrendsData {
  return {
    keyword,
    timeframe,
    region: 'VN',
    interest: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(2024, i, 1).toISOString(),
      value: Math.floor(Math.random() * 100)
    })),
    relatedTopics: [
      { title: 'SEO Tools', value: 85 },
      { title: 'Content Marketing', value: 72 },
      { title: 'Digital Marketing', value: 68 }
    ],
    relatedQueries: [
      { query: `${keyword} tools`, value: 90 },
      { query: `${keyword} guide`, value: 75 },
      { query: `${keyword} tips`, value: 60 }
    ]
  };
}
