import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY') || '';
const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';
const contentModel = Deno.env.get('CONTENT_MODEL') || '';
const LOG_LEVEL = (Deno.env.get('LOG_LEVEL') || 'info').toLowerCase();
const LEVEL_MAP: Record<string, number> = { error: 0, warn: 1, info: 2, debug: 3 };
const shouldLog = (level: string) => (LEVEL_MAP[level] ?? 2) <= (LEVEL_MAP[LOG_LEVEL] ?? 2);
const log = (level: 'error' | 'warn' | 'info' | 'debug', msg: string, data: Record<string, unknown> = {}) => {
  if (!shouldLog(level)) return;
  const entry = { level, msg, ts: new Date().toISOString(), ...data };
  console.log(JSON.stringify(entry));
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentRequest {
  title: string;
  keywords?: string[];
  language: string;
  tone: string;
  wordCount: number;
  intents: Array<{
    type: string;
    confidence: number;
  }>;
}

interface IntentAnalysisResponse {
  intents: Array<{
    type: string;
    confidence: number;
    description: string;
  }>;
  primaryIntent: string;
  keywordClusters: string[];
  seoRecommendations: string[];
}

serve(async (req) => {
  const reqId = (globalThis.crypto?.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random()}`;
  log('info', 'generate_content_request_received', { reqId });
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const fallbackOnly = !openAIApiKey && !geminiApiKey;
  if (fallbackOnly) {
    log('warn', 'no_ai_keys_using_fallback', { reqId });
  }

  try {
    const requestData: ContentRequest = await req.json();
    log('debug', 'request_payload', { reqId, hasKeywords: (requestData.keywords || []).length > 0 });

    const { title, keywords = [], language, tone, wordCount, intents } = requestData;

    // Step 1: Analyze search intent if not provided
    let intentAnalysis: IntentAnalysisResponse;
    
    if (!intents || intents.length === 0) {
      log('info', 'analyze_intent_start', { reqId, title });
      
      const intentPrompt = `Analyze the search intent for this title/keyword: "${title}"
      
      Provide a detailed analysis in JSON format with exactly this structure:
      {
        "intents": [
          {"type": "Informational", "confidence": 85, "description": "User wants to learn about the topic"},
          {"type": "Commercial", "confidence": 60, "description": "User is comparing options"},
          {"type": "Transactional", "confidence": 30, "description": "User ready to take action"},
          {"type": "Navigational", "confidence": 15, "description": "User looking for specific site"},
          {"type": "Local", "confidence": 10, "description": "User seeking local information"}
        ],
        "primaryIntent": "Informational",
        "keywordClusters": ["related keyword 1", "related keyword 2", "long tail phrase"],
        "seoRecommendations": ["Use H2/H3 structure", "Include FAQ section", "Add internal links"]
      }
      
      Language: ${language}
      Return ONLY valid JSON, no additional text.`;

      try {
        // Prefer OpenAI if available; if none, skip to fallback
        if (!fallbackOnly && openAIApiKey) {
          const intentResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: 'You are an SEO expert. Return only valid JSON without any markdown formatting or additional text.' 
              },
              { role: 'user', content: intentPrompt }
            ],
            max_tokens: 1000,
            temperature: 0.3,
          }),
        });

          if (!intentResponse.ok) {
            const errorText = await intentResponse.text();
          log('warn', 'openai_intent_http_error', { reqId, status: intentResponse.status, error: errorText });
            throw new Error(`OpenAI API error: ${intentResponse.status} - ${errorText}`);
          }

          const intentData = await intentResponse.json();
        log('debug', 'intent_response_received', { reqId });
          
          let rawContent = intentData.choices[0].message.content;
          // Clean up any markdown formatting
          rawContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          
          try {
            intentAnalysis = JSON.parse(rawContent);
          } catch (parseError) {
            log('warn', 'intent_parse_error_openai', { reqId, error: String(parseError) });
            console.error('Raw content:', rawContent);
            throw parseError;
          }
        } else if (!fallbackOnly && geminiApiKey) {
          // Gemini fallback for intent
          const mdl = contentModel.startsWith('gemini:') ? contentModel.split(':')[1] : 'gemini-pro';
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${geminiApiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: intentPrompt }] }] })
          });
          if (!res.ok) {
            const t = await res.text();
            log('warn', 'gemini_intent_http_error', { reqId, status: res.status, error: t });
            throw new Error(`Gemini API error: ${res.status} - ${t}`);
          }
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          intentAnalysis = JSON.parse(cleaned);
        } else {
          throw new Error('No AI provider available for intent');
        }
      } catch (error) {
        log('warn', 'intent_analysis_failed', { reqId, error: String(error) });
        // Fallback intent analysis
        intentAnalysis = {
          intents: [
            { type: "Informational", confidence: 70, description: "User wants to learn about the topic" },
            { type: "Commercial", confidence: 20, description: "User is comparing options" },
            { type: "Transactional", confidence: 5, description: "User ready to take action" },
            { type: "Navigational", confidence: 3, description: "User looking for specific site" },
            { type: "Local", confidence: 2, description: "User seeking local information" }
          ],
          primaryIntent: "Informational",
          keywordClusters: keywords.length > 0 ? keywords : ["related topics"],
          seoRecommendations: ["Use proper heading structure", "Include relevant keywords"]
        };
      }
    } else {
      // Use provided intents
      intentAnalysis = {
        intents: intents.map(intent => ({
          ...intent,
          description: `${intent.confidence}% confidence for ${intent.type} intent`
        })),
        primaryIntent: intents[0]?.type || "Informational",
        keywordClusters: keywords,
        seoRecommendations: ["Optimize for primary intent", "Include related keywords"]
      };
    }

    // Step 2: Generate content based on intent analysis
    log('info', 'generate_content_start', { reqId, primaryIntent: intentAnalysis.primaryIntent });

    const contentPrompt = `Create SEO-optimized content for: "${title}"

Primary Intent: ${intentAnalysis.primaryIntent}
Target Keywords: ${[title, ...keywords, ...intentAnalysis.keywordClusters].join(', ')}
Language: ${language}
Tone: ${tone}
Word Count: ${wordCount} words

Content Structure based on intent:
${intentAnalysis.primaryIntent === 'Informational' ? `
- Introduction with keyword
- Main sections with H2/H3 headings
- Detailed explanations and examples
- FAQ section with at least 3 Q&A
- Conclusion with call-to-action
` : ''}
${intentAnalysis.primaryIntent === 'Commercial' ? `
- Product/service comparison
- Benefits and features
- User reviews/testimonials
- Pricing information
- Comparison table (HTML <table> with at least 3 rows)
` : ''}
${intentAnalysis.primaryIntent === 'Transactional' ? `
- Clear value proposition
- Product specifications
- Prominent Call-to-Action (CTA)
- Trust signals (badges, guarantees)
- Contact information
` : ''}

SEO Requirements:
- Include target keyword in title and first paragraph
- Use keyword density 1-2%
- Include H2/H3 headings with related keywords
- Add meta description (<= 160 characters)
- Internal linking suggestions

Return ONLY valid JSON exactly as:
{
  "title": "SEO optimized title",
  "metaDescription": "Meta description <= 160 chars (single line, no quotes)",
  "content": "Full HTML content with proper headings",
  "headings": ["Heading 1", "Heading 2"], // 4..10 items
  "keywordDensity": "1.5%",
  "seoScore": 85 // 0..100
}
Do not include code fences or commentary.`;

    let generatedContent: {
      title: string;
      metaDescription: string;
      content: string;
      headings: string[];
      keywordDensity: string;
      seoScore: number;
    } | undefined;

    try {
      // Prefer OpenAI if available; fallback to Gemini; if none, skip API call and go to fallback
      if (!fallbackOnly && openAIApiKey) {
        const contentResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert SEO content writer. Create high-quality, optimized content that ranks well. Return only valid JSON without any markdown formatting or additional text.' 
            },
            { role: 'user', content: contentPrompt }
          ],
          max_tokens: 2000,
          temperature: 0.4,
        }),
      });

        if (!contentResponse.ok) {
          const errorText = await contentResponse.text();
          log('warn', 'openai_content_http_error', { reqId, status: contentResponse.status, error: errorText });
          throw new Error(`Content generation failed: ${contentResponse.status} - ${errorText}`);
        }

        const contentData = await contentResponse.json();
        log('info', 'content_generated_openai', { reqId });

        try {
          let rawContent = contentData.choices[0].message.content;
          // Clean up any markdown formatting
          rawContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          
          generatedContent = JSON.parse(rawContent);
        } catch (parseError) {
          log('warn', 'content_parse_error_openai', { reqId, error: String(parseError) });
          console.error('Raw content:', contentData.choices[0].message.content);
          throw parseError;
        }
      } else if (!fallbackOnly && geminiApiKey) {
        const mdl = contentModel.startsWith('gemini:') ? contentModel.split(':')[1] : 'gemini-pro';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${geminiApiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: contentPrompt }] }] })
        });
        if (!res.ok) {
          const t = await res.text();
          log('warn', 'gemini_content_http_error', { reqId, status: res.status, error: t });
          throw new Error(`Gemini content failed: ${res.status} - ${t}`);
        }
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        generatedContent = JSON.parse(cleaned);
      } else {
        throw new Error('No AI provider available for content');
      }
    } catch (error) {
      log('warn', 'content_generation_error', { reqId, error: String(error) });
      // Fallback content
      generatedContent = {
        title: title,
        metaDescription: `Learn about ${title}. Comprehensive guide with examples and best practices.`,
        content: `<h1>${title}</h1>\n<p>This is AI-generated content about ${title}.</p>\n<h2>Overview</h2>\n<p>Content will be generated here...</p>`,
        headings: ["Overview", "Key Points"],
        keywordDensity: "1.2%",
        seoScore: 75
      };
    }

    // Normalize output
    const normalized = (() => {
      const resp = {
        intentAnalysis,
        content: generatedContent,
        success: true,
        timestamp: new Date().toISOString()
      } as any;
      // Clamp and trim
      if (resp?.content?.metaDescription && resp.content.metaDescription.length > 160) {
        resp.content.metaDescription = resp.content.metaDescription.slice(0, 160);
      }
      if (typeof resp?.content?.seoScore === 'number') {
        resp.content.seoScore = Math.max(0, Math.min(100, Math.round(resp.content.seoScore)));
      }
      // Ensure intent-specific features
      const ensureIntentFeatures = () => {
        try {
          const html = String(resp?.content?.content || '');
          const intent = String(resp?.intentAnalysis?.primaryIntent || '').toLowerCase();
          let updatedHtml = html;
          const addSection = (title: string, body: string) => `\n<h2>${title}</h2>\n${body}`;

          // Helper: extract headings H1..H3 text
          const extractHeadings = (source: string) => {
            const lines = String(source).split(/\r?\n/);
            const heads: string[] = [];
            for (const ln of lines) {
              const m = ln.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i) || ln.match(/^(#{1,3})\s+(.*)$/);
              if (m) {
                const text = (m[1] || m[2] || '').replace(/<[^>]+>/g, '').trim();
                if (text) heads.push(text);
              }
              if (heads.length >= 12) break;
            }
            return heads;
          };
          // Helper: slugify
          const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

          if (intent.includes('informational')) {
            // Table of contents if missing
            if (!/mục lục|table of contents|toc/i.test(html)) {
              const heads = extractHeadings(html);
              if (heads.length >= 4) {
                const items = heads.slice(0, 10).map(h => `<li><a href="#${slug(h)}">${h}</a></li>`).join('');
                updatedHtml = addSection('Mục lục', `<ul>${items}</ul>`) + updatedHtml;
              }
            }
            // FAQ section
            if (!/faq/i.test(updatedHtml)) {
              updatedHtml += addSection('FAQ', '<p><strong>1.</strong> Câu hỏi 1?</p><p>Trả lời ngắn gọn.</p><p><strong>2.</strong> Câu hỏi 2?</p><p>Trả lời ngắn gọn.</p><p><strong>3.</strong> Câu hỏi 3?</p><p>Trả lời ngắn gọn.</p>');
            }
          } else if (intent.includes('commercial')) {
            if (!/<table/i.test(updatedHtml)) {
              updatedHtml += addSection('So sánh', '<table><thead><tr><th>Tiêu chí</th><th>Phương án A</th><th>Phương án B</th></tr></thead><tbody><tr><td>Tính năng</td><td>Tốt</td><td>Khá</td></tr><tr><td>Giá</td><td>$$</td><td>$</td></tr><tr><td>Hỗ trợ</td><td>24/7</td><td>Giờ hành chính</td></tr></tbody></table>');
            }
          } else if (intent.includes('transactional')) {
            const hasCTA = /call-to-action|cta|mua ngay|đăng ký/i.test(updatedHtml);
            if (!hasCTA) {
              updatedHtml += addSection('Hành động', '<p><a href="#" style="display:inline-block;padding:8px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Đăng ký ngay</a></p><ul><li>Cam kết hoàn tiền 30 ngày</li><li>Hỗ trợ 24/7</li><li>Bảo mật thông tin</li></ul>');
            }
          }

          // Internal linking suggestions (generic)
          if (!/Internal Links|Liên kết nội bộ/i.test(updatedHtml)) {
            const heads = extractHeadings(updatedHtml);
            if (heads.length >= 3) {
              const items = heads.slice(0, 3).map(h => `<li>Liên kết nội bộ: <a href="#${slug(h)}">${h}</a></li>`).join('');
              updatedHtml += addSection('Liên kết nội bộ', `<ul>${items}</ul>`);
            }
          }

          resp.content.content = updatedHtml;
        } catch {
          /* noop */
        }
      };
      ensureIntentFeatures();

      // Ensure headings 4..10 by deriving from HTML if needed
      const deriveHeads = () => {
        try {
          const lines = String(resp?.content?.content || '').split(/\r?\n/);
          const heads: string[] = [];
          for (const ln of lines) {
            const m = ln.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i) || ln.match(/^(#{1,3})\s+(.*)$/);
            if (m) {
              const text = (m[1] || m[2] || '').replace(/<[^>]+>/g, '').trim();
              if (text) heads.push(text);
            }
            if (heads.length >= 10) break;
          }
          return heads;
        } catch {
          return [];
        }
      };
      if (!Array.isArray(resp?.content?.headings) || resp.content.headings.length < 4) {
        const inferred = deriveHeads();
        if (inferred.length >= 4) resp.content.headings = inferred;
      } else if (resp.content.headings.length > 10) {
        resp.content.headings = resp.content.headings.slice(0, 10);
      }
      return resp;
    })();

    const response = normalized;

    log('info', 'generate_content_success', { reqId });
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    log('error', 'generate_content_unhandled_error', { error: String(error) });
    return new Response(
      JSON.stringify({ 
        error: 'Content generation failed', 
        details: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});