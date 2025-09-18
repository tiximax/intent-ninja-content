import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContentRequest {
  title: string;
  keywords?: string[];
  language: string;
  tone: string;
  wordCount: number;
  intents?: Array<{
    type: string;
    confidence: number;
  }>;
}

interface IntentAnalysis {
  intents: Array<{
    type: string;
    confidence: number;
    description: string;
  }>;
  primaryIntent: string;
  keywordClusters: string[];
  seoRecommendations: string[];
}

interface GeneratedContent {
  title: string;
  metaDescription: string;
  content: string;
  headings: string[];
  keywordDensity: string;
  seoScore: number;
}

interface ContentGenerationResponse {
  intentAnalysis: IntentAnalysis;
  content: GeneratedContent;
  success: boolean;
  timestamp: string;
}

const isMockEnabled = String((((import.meta as unknown as { env?: Record<string, string> }).env)?.VITE_USE_MOCK_CONTENT ?? '')).toLowerCase() === 'true';

function buildMockResponse(req: ContentRequest): ContentGenerationResponse {
  const title = req.title || 'Nội dung SEO Mẫu';
  const keywords = (req.keywords && req.keywords.length > 0) ? req.keywords : ['seo', 'content optimization'];
  const lang = req.language || 'vi';
  const wordCount = req.wordCount || 800;

  const headings = [
    `# ${title}`,
    '## Giới thiệu',
    '## Chiến lược tối ưu',
    '## Kết luận'
  ];

  const contentLines: string[] = [];
  contentLines.push(`# ${title}`);
  contentLines.push('');
  contentLines.push('## Giới thiệu');
  contentLines.push(`Bài viết này được tạo ở chế độ mock để minh họa luồng tạo nội dung (${lang}).`);
  contentLines.push('');
  contentLines.push('## Chiến lược tối ưu');
  contentLines.push('- Nghiên cứu từ khóa');
  contentLines.push('- Phù hợp search intent');
  contentLines.push('- Cấu trúc nội dung rõ ràng');
  contentLines.push('');
  contentLines.push('## Kết luận');
  contentLines.push('Nội dung mock giúp kiểm thử UI/luồng E2E ngay cả khi backend chưa sẵn sàng.');

  const content = contentLines.join('\n');

  const response: ContentGenerationResponse = {
    success: true,
    timestamp: new Date().toISOString(),
    intentAnalysis: {
      primaryIntent: 'informational',
      intents: [
        { type: 'informational', confidence: 85, description: 'Người dùng muốn tìm hiểu kiến thức tổng quan' },
        { type: 'commercial', confidence: 60, description: 'Người dùng có thể so sánh giải pháp' },
        { type: 'transactional', confidence: 30, description: 'Ít khả năng hành động mua ngay' },
        { type: 'navigational', confidence: 20, description: 'Ít khả năng điều hướng đến thương hiệu cụ thể' },
        { type: 'local', confidence: 15, description: 'Ít liên quan địa phương' }
      ],
      keywordClusters: keywords.slice(0, 8),
      seoRecommendations: [
        'Thêm từ khóa vào H1/H2',
        'Tối ưu meta description 150-160 ký tự',
        'Sử dụng internal links hợp lý'
      ]
    },
    content: {
      title,
      metaDescription: `Bài viết về ${title} với chiến lược SEO cơ bản.`,
      content,
      headings,
      keywordDensity: keywords[0] || 'seo',
      seoScore: 82
    }
  };
  return response;
}

export const useContentGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [intentAnalysis, setIntentAnalysis] = useState<IntentAnalysis | null>(null);
  const { toast } = useToast();

  const generateContent = async (request: ContentRequest) => {
    setIsGenerating(true);

    const applyMock = () => {
      const mock = buildMockResponse(request);
      setIntentAnalysis(mock.intentAnalysis);
      setGeneratedContent(mock.content);
      toast({
        title: 'Đang dùng Mock Mode',
        description: 'Backend chưa sẵn sàng hoặc đang ở chế độ mock. Nội dung hiển thị là dữ liệu mô phỏng.',
      });
      return mock;
    };

    try {
      console.log('Starting content generation:', request);

      if (isMockEnabled) {
        return applyMock();
      }

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: request,
      });

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        // Fallback sang mock nếu backend lỗi
        return applyMock();
      }

      if (!data || !data.success) {
        console.warn('Invalid backend response, falling back to mock');
        return applyMock();
      }

      const response: ContentGenerationResponse = data;

      setIntentAnalysis(response.intentAnalysis);
      setGeneratedContent(response.content);

      toast({
        title: 'Nội dung đã được tạo thành công!',
        description: `SEO Score: ${response.content.seoScore}/100`,
      });

      console.log('Content generation completed successfully');
      return response;
    } catch (error) {
      console.error('Content generation unexpected error:', error);
      // Fallback cuối cùng
      return applyMock();
    } finally {
      setIsGenerating(false);
    }
  };

  const clearContent = () => {
    setGeneratedContent(null);
    setIntentAnalysis(null);
  };

  return {
    generateContent,
    clearContent,
    isGenerating,
    generatedContent,
    intentAnalysis,
  };
};
