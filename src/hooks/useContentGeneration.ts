import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { apiRetry, RETRY_CONFIGS, RetryError } from '@/lib/retry';
import { useEnhancedToast } from '@/components/ui/enhanced-toast';
import { countWordsFromHtml, mergeHtmlSections } from '@/lib/content-length';

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
  outline?: string[];
  strictOutline?: boolean;
  brandVoicePreset?: string;
  brandCustomStyle?: string;
  sectionDepth?: 'basic' | 'standard' | 'deep';
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
  const lang = (req.language || 'vi').toLowerCase();

  const t = (vi: string, en: string) => (lang.startsWith('vi') ? vi : en);
  const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

  const userOutline = Array.isArray(req.outline) ? req.outline.filter(Boolean).slice(0, 8) : [];
  const defaultHeads = [
    t('Giới thiệu', 'Introduction'),
    t('Tổng quan', 'Overview'),
    t('Quy trình', 'Process'),
    t('Checklist', 'Checklist'),
    'FAQ',
    t('Kết luận', 'Conclusion')
  ];
  const headings = userOutline.length > 0 ? userOutline : defaultHeads;

  const html = `
  <h1>${title}</h1>
  ${headings[0] ? `<h2 id=\"${slug(headings[0])}\">${headings[0]}</h2>` : ''}
  <p>${t('Nội dung này được tạo ở chế độ mô phỏng (Mock Mode) để giúp bạn kiểm thử nhanh luồng tạo nội dung.', 'This content is generated in Mock Mode to help you quickly test the content flow.')}</p>
  ${headings[1] ? `<h2 id=\"${slug(headings[1])}\">${headings[1]}</h2>` : ''}
  <ul>
    <li>${t('Từ khóa mục tiêu', 'Target keywords')}: <strong>${[title, ...keywords].filter(Boolean).slice(0,8).join(', ')}</strong></li>
    <li>${t('Cấu trúc H2/H3 rõ ràng', 'Clear H2/H3 structure')}</li>
    <li>${t('Tối ưu meta và internal link', 'Optimize meta and internal links')}</li>
  </ul>
  ${headings[2] ? `<h2 id=\"${slug(headings[2])}\">${headings[2]}</h2>` : ''}
  <ol>
    <li>${t('Nghiên cứu từ khóa & intent', 'Research keywords & intent')}</li>
    <li>${t('Lập dàn ý, chèn keyword tự nhiên', 'Outline and insert keywords naturally')}</li>
    <li>${t('Viết nội dung có ví dụ, bullet, bảng', 'Write with examples, bullets, tables')}</li>
    <li>${t('Tối ưu meta, liên kết nội bộ', 'Optimize meta & internal links')}</li>
  </ol>
  ${headings[3] ? `<h2 id=\"${slug(headings[3])}\">${headings[3]}</h2>` : ''}
  <ul>
    <li>${t('H1 chứa từ khóa chính', 'H1 contains the primary keyword')}</li>
    <li>${t('Keyword xuất hiện 100 từ đầu', 'Keyword appears in first 100 words')}</li>
    <li>${t('Thêm 2–3 internal links liên quan', 'Add 2–3 relevant internal links')}</li>
  </ul>
  ${headings[4] ? `<h2 id=\"${slug(headings[4])}\">${headings[4]}</h2>` : ''}
  <p><strong>1.</strong> ${t('Đây là nội dung mô phỏng?', 'Is this simulated content?')}</p>
  <p>${t('Đúng, dùng cho kiểm thử UI/E2E khi backend chưa sẵn sàng.', 'Yes, for UI/E2E testing when backend is not ready.')}</p>
  <p><strong>2.</strong> ${t('Có thể sử dụng thực tế?', 'Can I use it in production?')}</p>
  <p>${t('Bạn nên chỉnh sửa theo ngữ cảnh của bạn và bổ sung dữ liệu thực.', 'You should adapt it to your context and add real data.')}</p>
  ${headings[5] ? `<h2 id=\"${slug(headings[5])}\">${headings[5]}</h2>` : ''}
  <p>${t('Tập trung mang lại giá trị cho người dùng và tối ưu SEO tự nhiên.', 'Focus on user value and natural SEO optimization.')}</p>`;

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
      metaDescription: t(`Hướng dẫn thực tế về ${title} với quy trình, checklist và FAQ.`, `Practical guide to ${title} with process, checklist and FAQs.`),
      content: html,
      headings: [title, ...headings],
      keywordDensity: keywords[0] || 'seo',
      seoScore: 84
    }
  };
  return response;
}

export const useContentGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [intentAnalysis, setIntentAnalysis] = useState<IntentAnalysis | null>(null);
  const { toast } = useToast();
  const enhancedToast = useEnhancedToast();
  const [lastRequest, setLastRequest] = useState<ContentRequest | null>(null);
  const sectionHistoryRef = useRef<Record<string, string[]>>({});
  const sectionRedoRef = useRef<Record<string, string[]>>({});
  const [isExpanding, setIsExpanding] = useState(false);
  const cancelExpansionRef = useRef(false);

  const generateContent = async (request: ContentRequest) => {
    setIsGenerating(true);
    cancelExpansionRef.current = false;
    setIsExpanding(false);

    const genReqId = () => {
      try {
        // @ts-ignore
        if (typeof crypto !== 'undefined' && crypto?.randomUUID) return crypto.randomUUID();
      } catch {}
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };
    const requestId = genReqId();

    // Sentry breadcrumb: start
    try {
      const { breadcrumb } = await import('@/observability/sentry');
      breadcrumb('content_generation', 'start', {
        title: request.title,
        language: request.language,
        tone: request.tone,
        wordCount: request.wordCount,
        sectionDepth: request.sectionDepth,
        brandVoicePreset: request.brandVoicePreset || '',
        outlineCount: Array.isArray(request.outline) ? request.outline.length : 0,
        requestId,
      }, 'info');
    } catch {}

    // Hiển thị loading toast và lấy id để cập nhật sau
    const loadingToastId = enhancedToast.content.start();

    const applyMock = () => {
      const mock = buildMockResponse(request);
      setIntentAnalysis(mock.intentAnalysis);
      setGeneratedContent(mock.content);
      enhancedToast.content.success(mock.content.seoScore, loadingToastId);
      enhancedToast.content.mockMode();
      return mock;
    };

    try {
      console.log('Starting content generation:', request);

      if (isMockEnabled) {
        return applyMock();
      }

      const response = await apiRetry(
        async () => {
          const { data, error } = await supabase.functions.invoke('generate-content', {
            body: request,
            headers: { 'x-request-id': requestId },
          });
          
          if (error) {
            throw new Error(`Content generation failed: ${error.message || 'Unknown error'}`);
          }
          
          return data;
        },
        {
          ...RETRY_CONFIGS.contentGeneration,
          apiName: 'Content Generation',
          onRetry: (error, attempt) => {
            enhancedToast.retryAttempt(attempt, RETRY_CONFIGS.contentGeneration.maxRetries || 2, 'content-generation');
          },
        }
      );
      
      setLastRequest(request);

      console.log('Supabase response:', { data: response });

      if (!response || !response.success) {
        console.warn('Invalid backend response, falling back to mock');
        return applyMock();
      }

      const data: ContentGenerationResponse = response;

      // Nếu backend trả về fallback kém chất lượng, thay bằng bản mock chất lượng
      const isPoorFallback = typeof data?.content?.content === 'string' && (
        /Content will be generated here/i.test(data.content.content) ||
        /This is AI-generated content/i.test(data.content.content)
      );
      if (isPoorFallback) {
        const improved = buildMockResponse(request);
        setIntentAnalysis(improved.intentAnalysis);
        setGeneratedContent(improved.content);
        enhancedToast.warning(
          'Đã cải thiện nội dung fallback',
          'Tạo bản xem trước chất lượng hơn khi backend trả về nội dung tối thiểu.',
          'content-generation'
        );
        console.log('Replaced poor fallback with improved mock');
        return improved;
      }

      setIntentAnalysis(data.intentAnalysis);
      setGeneratedContent(data.content);

      try {
        const reqId = (data as any)?.requestId;
        const { setSentryRequestId, breadcrumb } = await import('@/observability/sentry');
        setSentryRequestId(reqId);
        breadcrumb('content_generation', 'success', {
          requestId: reqId,
          seoScore: data?.content?.seoScore,
          headingsCount: Array.isArray(data?.content?.headings) ? data.content.headings.length : undefined,
        }, 'info');
      } catch {}

      // Ensure minimum words by orchestrating expansions when backend returns short content
      try {
        const targetWords = request.wordCount || 0;
        let currentHtml = data.content.content || '';
        let currentCount = countWordsFromHtml(currentHtml);

        if (targetWords > 0 && currentCount < targetWords) {
          try {
            const { breadcrumb } = await import('@/observability/sentry');
            breadcrumb('content_generation', 'expand_start', { targetWords, currentCount }, 'info');
          } catch {}
          setIsExpanding(true);
          const progressId = 'expansion-progress';
          enhancedToast.show({ type: 'loading', context: 'content-generation', id: progressId, title: 'Đang mở rộng nội dung', description: `Bắt đầu mở rộng...` });
          const expansionOutlines: string[][] = [
            [
              'Nghiên cứu từ khóa nâng cao cho E-commerce',
              'Schema & Rich Results cho PDP/PLP/Blog',
              'Internal Linking: Hub, Spoke, Breadcrumb',
              'Tối ưu Core Web Vitals cho chuyển đổi',
            ],
            [
              'Case study: tăng trưởng organic',
              'Case study: cải thiện tỷ lệ chuyển đổi',
              'FAQ: Câu hỏi thường gặp về SEO Onpage TMĐT',
              'Checklist triển khai & QA trước khi publish',
            ],
          ];

          for (let attempt = 0; attempt < 8 && currentCount < targetWords && !cancelExpansionRef.current; attempt++) {
            const plan = expansionOutlines[attempt % expansionOutlines.length];
            try {
              enhancedToast.show({ type: 'loading', context: 'content-generation', id: 'expansion-progress', title: 'Đang mở rộng nội dung', description: `(${attempt + 1}/8) Vui lòng chờ...`, dedupe: true });
              try { const { breadcrumb } = await import('@/observability/sentry'); breadcrumb('content_generation', 'expand_attempt', { attempt: attempt + 1 }, 'debug'); } catch {}
              const { data: expData, error: expError } = await supabase.functions.invoke('generate-content', {
                body: {
                  ...request,
                  title: `${request.title} — Phần mở rộng #${attempt + 1}`,
                  outline: plan,
                },
                headers: { 'x-request-id': `${requestId}-exp-${attempt + 1}` },
              });
              if (expError || !expData?.content?.content) break;

              const extraHtml = String(expData.content.content);
              currentHtml = mergeHtmlSections(currentHtml, extraHtml, plan[0] || `Phần mở rộng #${attempt + 1}`);
              currentCount = countWordsFromHtml(currentHtml);

              // Update state progressively so user sees content growing
              setGeneratedContent((prev) =>
                prev ? { ...prev, content: currentHtml } : { ...data.content, content: currentHtml }
              );
            } catch (e) {
              break;
            }
          }

          // Done expanding, clear progress
          enhancedToast.dismiss('expansion-progress');
          setIsExpanding(false);

          try {
            const { breadcrumb } = await import('@/observability/sentry');
            breadcrumb('content_generation', cancelExpansionRef.current ? 'expand_cancel' : 'expand_done', { currentCount, targetWords }, 'info');
          } catch {}

          if (cancelExpansionRef.current) {
            enhancedToast.warning('Đã dừng mở rộng', `Độ dài hiện tại: ${currentCount} từ`, 'content-generation');
          } else if (currentCount >= targetWords) {
            enhancedToast.success('Đã đạt tối thiểu', `Số từ hiện tại: ${currentCount} / ${targetWords}`, 'content-generation');
          }
        }
      } catch (e) {
        // Silent fail on orchestrator to preserve base content
        console.warn('Min-words orchestrator skipped due to error:', e);
      }

      enhancedToast.content.success(data.content.seoScore);

      console.log('Content generation completed successfully');
      return data;
    } catch (error) {
      try {
        const { breadcrumb } = await import('@/observability/sentry');
        breadcrumb('content_generation', 'failure', { message: (error as any)?.message }, 'error');
      } catch {}
      console.error('Content generation failed after retries:', error);
      
      if (error instanceof RetryError) {
        enhancedToast.content.error(undefined, loadingToastId);
      } else {
        enhancedToast.content.error(undefined, loadingToastId);
      }
      
      // Fallback cuối cùng
      return applyMock();
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateSection = async (heading: string, opts?: { action?: 'expand' | 'shorten' | 'examples' | 'data' | 'cta' }) => {
    if (!generatedContent) {
      toast({ title: 'Chưa có nội dung', description: 'Hãy tạo nội dung trước rồi mới regenerate từng mục.' });
      return;
    }
    try {
      const slug = heading.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      const pattern = new RegExp(`(<h2[^>]*id=\"${slug}\"[^>]*>[\\s\\S]*?)(?=<h2[^>]*id=|$)`, 'i');

      let sectionHtml: string | null = null;

      if (lastRequest) {
        // Save current snapshot before regenerate
        const matchBefore = generatedContent.content.match(pattern);
        if (matchBefore) {
          const snap = matchBefore[0];
          sectionHistoryRef.current[slug] = sectionHistoryRef.current[slug] || [];
          sectionHistoryRef.current[slug].push(snap);
          // Clear redo stack on new change
          sectionRedoRef.current[slug] = [];
          // limit history to 3
          if (sectionHistoryRef.current[slug].length > 3) sectionHistoryRef.current[slug].shift();
        }
        const req = { ...lastRequest, regenerateSection: heading, regenerateAction: opts?.action } as any;
        const { data, error } = await supabase.functions.invoke('generate-content', { body: req });
        if (error) throw error;
        sectionHtml = data?.sectionHtml as string;
      }

      // Local fallback when no lastRequest (Mock Mode / E2E)
      if (!sectionHtml) {
        let extra = '';
        switch (opts?.action) {
          case 'cta':
            extra = `<p><a href="#" style="display:inline-block;padding:8px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Đăng ký ngay</a></p>`;
            break;
          case 'examples':
            extra = `<ul><li>Ví dụ 1: áp dụng thực tế</li><li>Ví dụ 2: bước triển khai</li></ul>`;
            break;
          case 'data':
            extra = `<p><strong>53%</strong> người dùng rời trang nếu tải chậm &gt;3s (Nguồn: Google)</p>`;
            break;
          case 'expand':
            extra = `<p>Đoạn bổ sung mở rộng chiều sâu, nhấn mạnh bước thực thi.</p>`;
            break;
          case 'shorten':
            extra = `<p>Tóm tắt ngắn gọn, tập trung ý chính.</p>`;
            break;
        }
        const match = generatedContent.content.match(pattern);
        if (match) {
          // Save snapshot before change
          const snap = match[0];
          sectionHistoryRef.current[slug] = sectionHistoryRef.current[slug] || [];
          sectionHistoryRef.current[slug].push(snap);
          sectionRedoRef.current[slug] = [];
          if (sectionHistoryRef.current[slug].length > 3) sectionHistoryRef.current[slug].shift();
          sectionHtml = match[0].replace(/<\/h2>/i, '</h2>') + extra;
        }
      }

      if (!sectionHtml) throw new Error('No sectionHtml available');

      const newContent = generatedContent.content.replace(pattern, sectionHtml);
      setGeneratedContent({ ...generatedContent, content: newContent });
      toast({ title: 'Regenerate thành công', description: `Mục \"${heading}\" đã được cập nhật.` });
    } catch (e: any) {
      console.error('Regenerate section error:', e);
      toast({ title: 'Lỗi regenerate', description: e?.message || 'Không thể regenerate mục này', variant: 'destructive' });
    }
  };

  const undoSection = async (heading: string) => {
    if (!generatedContent) return;
    const slug = heading.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    const pattern = new RegExp(`(<h2[^>]*id=\"${slug}\"[^>]*>[\\s\\S]*?)(?=<h2[^>]*id=|$)`, 'i');
    const stack = sectionHistoryRef.current[slug];
    if (!stack || stack.length === 0) {
      toast({ title: 'Không có lịch sử để hoàn tác', description: heading });
      return;
    }
    const prev = stack.pop()!;
    const currentMatch = generatedContent.content.match(pattern);
    if (currentMatch) {
      sectionRedoRef.current[slug] = sectionRedoRef.current[slug] || [];
      sectionRedoRef.current[slug].push(currentMatch[0]);
      if (sectionRedoRef.current[slug].length > 3) sectionRedoRef.current[slug].shift();
    }
    const newContent = generatedContent.content.replace(pattern, prev);
    setGeneratedContent({ ...generatedContent, content: newContent });
    toast({ title: 'Hoàn tác thành công', description: heading });
  };

  const redoSection = async (heading: string) => {
    if (!generatedContent) return;
    const slug = heading.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    const pattern = new RegExp(`(<h2[^>]*id=\"${slug}\"[^>]*>[\\s\\S]*?)(?=<h2[^>]*id=|$)`, 'i');
    const stack = sectionRedoRef.current[slug];
    if (!stack || stack.length === 0) {
      toast({ title: 'Không có bước để Redo', description: heading });
      return;
    }
    const redoHtml = stack.pop()!;
    // Save current snapshot into history before redo
    const currentMatch = generatedContent.content.match(pattern);
    if (currentMatch) {
      sectionHistoryRef.current[slug] = sectionHistoryRef.current[slug] || [];
      sectionHistoryRef.current[slug].push(currentMatch[0]);
      if (sectionHistoryRef.current[slug].length > 3) sectionHistoryRef.current[slug].shift();
    }
    const newContent = generatedContent.content.replace(pattern, redoHtml);
    setGeneratedContent({ ...generatedContent, content: newContent });
    toast({ title: 'Redo thành công', description: heading });
  };

  const getCurrentSectionHtml = (heading: string): string | null => {
    if (!generatedContent) return null;
    const slug = heading.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    const pattern = new RegExp(`(<h2[^>]*id=\"${slug}\"[^>]*>[\\s\\S]*?)(?=<h2[^>]*id=|$)`, 'i');
    const match = generatedContent.content.match(pattern);
    return match ? match[0] : null;
  };

  const getLastSnapshot = (heading: string): string | null => {
    const slug = heading.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    const stack = sectionHistoryRef.current[slug];
    if (!stack || stack.length === 0) return null;
    return stack[stack.length - 1];
  };

  const clearContent = () => {
    setGeneratedContent(null);
    setIntentAnalysis(null);
  };

  const cancelExpansion = () => { cancelExpansionRef.current = true; };

  return {
    generateContent,
    clearContent,
    regenerateSection,
    undoSection,
    redoSection,
    getCurrentSectionHtml,
    getLastSnapshot,
    isGenerating,
    isExpanding,
    cancelExpansion,
    generatedContent,
    intentAnalysis,
  };
};
