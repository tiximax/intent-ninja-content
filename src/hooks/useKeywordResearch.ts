import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { apiRetry, RETRY_CONFIGS, RetryError } from '@/lib/retry';
import { useEnhancedToast } from '@/components/ui/enhanced-toast';

export interface Keyword {
  id: string;
  keyword: string;
  search_volume: number | null;
  difficulty_score: number | null;
  cpc: number | null;
  intent_type: string | null;
  competition_level: string | null;
  created_at: string;
  updated_at: string;
}

export interface KeywordSearchParams {
  seed_keywords: string[];
  location?: string;
  language?: string;
  include_questions?: boolean;
  include_related?: boolean;
  min_search_volume?: number;
  max_difficulty?: number;
}

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

export const useKeywordResearch = () => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [keywordData, setKeywordData] = useState<KeywordResearchResponse | null>(null);
  const enhancedToast = useEnhancedToast();

  const searchKeywords = async (params: KeywordSearchParams): Promise<any[]> => {
    setLoading(true);
    try {
      console.log('Searching keywords with params:', params);
      // Dùng mock đơn giản cho flow search list
      const mockResults = params.seed_keywords.flatMap(seed => [
        {
          keyword: seed,
          search_volume: Math.floor(Math.random() * 10000) + 100,
          difficulty: Math.floor(Math.random() * 100),
          cpc: Math.random() * 5,
          competition: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          intent: ['informational', 'commercial', 'transactional'][Math.floor(Math.random() * 3)],
          trend: ['rising', 'stable', 'declining'][Math.floor(Math.random() * 3)]
        },
        {
          keyword: `${seed} guide`,
          search_volume: Math.floor(Math.random() * 5000) + 50,
          difficulty: Math.floor(Math.random() * 80),
          cpc: Math.random() * 3,
          competition: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          intent: 'informational',
          trend: ['rising', 'stable', 'declining'][Math.floor(Math.random() * 3)]
        },
        {
          keyword: `best ${seed}`,
          search_volume: Math.floor(Math.random() * 3000) + 30,
          difficulty: Math.floor(Math.random() * 90),
          cpc: Math.random() * 7,
          competition: ['medium', 'high'][Math.floor(Math.random() * 2)],
          intent: 'commercial',
          trend: ['rising', 'stable', 'declining'][Math.floor(Math.random() * 3)]
        },
        {
          keyword: `${seed} tool`,
          search_volume: Math.floor(Math.random() * 2000) + 20,
          difficulty: Math.floor(Math.random() * 85),
          cpc: Math.random() * 6,
          competition: ['medium', 'high'][Math.floor(Math.random() * 2)],
          intent: 'transactional',
          trend: ['rising', 'stable', 'declining'][Math.floor(Math.random() * 3)]
        }
      ]);

      setSearchResults(mockResults);
      enhancedToast.keyword.success(mockResults.length);
      return mockResults;
    } catch (error) {
      console.error('Keyword search error:', error);
      enhancedToast.keyword.error();
      return [];
    } finally {
      setLoading(false);
    }
  };

  const researchKeywords = async (seedKeyword: string, options?: {
    language?: string;
    location?: string;
    includeVariations?: boolean;
  }) => {
    setIsLoading(true);
    
    try {
      const loadingId = enhancedToast.keyword.start();
      const response = await apiRetry(
        async () => {
          // Chuyển sang dùng provider strategy (mock/serpapi)
          const { researchKeywordsProvider } = await import('@/services/keywordsProvider');
          return await researchKeywordsProvider(seedKeyword, options);
        },
        {
          ...RETRY_CONFIGS.keywordResearch,
          apiName: 'Keyword Research',
          onRetry: (error, attempt) => {
            enhancedToast.retryAttempt(attempt, RETRY_CONFIGS.keywordResearch.maxRetries || 3, 'keyword-research');
          },
        }
      );
      
      setKeywordData(response);
      enhancedToast.keyword.success(response.keywords.length, loadingId);
      return response;

    } catch (error) {
      console.error('Keyword research failed after retries:', error);
      
      if (error instanceof RetryError) {
        enhancedToast.keyword.error();
      } else {
        enhancedToast.keyword.error();
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getTrends = async (keyword: string, timeframe: string = '12m') => {
    setIsLoading(true);
    
    try {
      const { researchKeywordsProvider } = await import('@/services/keywordsProvider');
      const res = await researchKeywordsProvider(keyword, { timeframe });
      return res.trends[0];
      
    } catch (error) {
      console.error('Trends fetch error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const saveKeywords = async (keywordsToSave: any[], projectId: string) => {
    try {
      const keywordData = keywordsToSave.map(kw => ({
        project_id: projectId,
        keyword: kw.keyword,
        search_volume: kw.search_volume,
        difficulty_score: kw.difficulty,
        cpc: kw.cpc,
        intent_type: kw.intent,
        competition_level: kw.competition
      }));

      await apiRetry(
        async () => {
          const { error } = await supabase
            .from('keywords')
            .insert(keywordData);
          
          if (error) {
            throw new Error(`Save keywords failed: ${error.message}`);
          }
        },
        {
          ...RETRY_CONFIGS.dataSave,
          apiName: 'Save Keywords',
        }
      );

      enhancedToast.success('Đã lưu từ khóa', 'Từ khóa đã được lưu vào dự án thành công.', 'data-save');
    } catch (error) {
      console.error('Error saving keywords after retries:', error);
      
      if (error instanceof RetryError) {
        enhancedToast.error(
          'Lưu thất bại',
          `Đã thử ${error.attempt} lần. Vui lòng kiểm tra kết nối và thử lại.`,
          'data-save'
        );
      } else {
        enhancedToast.error('Lỗi lưu từ khóa', 'Không thể lưu dữ liệu. Vui lòng thử lại.', 'data-save');
      }
    }
  };

  const getProjectKeywords = async (projectId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeywords(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching project keywords:', error);
      toast.error('Lỗi tải từ khóa dự án');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const deleteKeyword = async (keywordId: string) => {
    try {
      const { error } = await supabase
        .from('keywords')
        .delete()
        .eq('id', keywordId);

      if (error) throw error;
      setKeywords(prev => prev.filter(k => k.id !== keywordId));
      toast.success('Đã xóa từ khóa');
    } catch (error) {
      console.error('Error deleting keyword:', error);
      toast.error('Lỗi xóa từ khóa');
    }
  };

  const analyzeSearchIntent = async (keywords: string[]) => {
    try {
      const intents = keywords.map(keyword => {
        const intentTypes = [
          { type: 'informational', confidence: Math.random() * 100 },
          { type: 'commercial', confidence: Math.random() * 100 },
          { type: 'transactional', confidence: Math.random() * 100 },
          { type: 'navigational', confidence: Math.random() * 100 }
        ].sort((a, b) => b.confidence - a.confidence);

        return {
          keyword,
          primary_intent: intentTypes[0].type,
          intents: intentTypes,
          recommendations: [
            'Tạo nội dung hướng dẫn chi tiết',
            'Thêm từ khóa long-tail',
            'Tối ưu cho featured snippets'
          ]
        };
      });
      return intents;
    } catch (error) {
      console.error('Error analyzing search intent:', error);
      return [];
    }
  };

  const clearData = () => {
    setKeywordData(null);
  };

  return {
    keywords,
    searchResults,
    loading,
    isLoading,
    keywordData,
    searchKeywords,
    researchKeywords,
    getTrends,
    saveKeywords,
    getProjectKeywords,
    deleteKeyword,
    analyzeSearchIntent,
    clearData
  };
};

// Mock data generator with realistic structure
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

  const keywords: KeywordData[] = baseKeywords.map((kw, index) => ({
    keyword: kw,
    searchVolume: Math.floor(Math.random() * 10000) + 100,
    competition: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
    competitionIndex: Math.random(),
    cpc: Math.random() * 5 + 0.5,
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