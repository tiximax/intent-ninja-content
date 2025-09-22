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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
  outline?: string[]; // optional custom outline (H2/H3 headings)
  strictOutline?: boolean; // when true, generate strictly per outline (no extra H2), per-section
  brandVoicePreset?: string;
  brandCustomStyle?: string;
  sectionDepth?: 'basic' | 'standard' | 'deep';
  regenerateSection?: string; // if provided, generate only this section html
  regenerateAction?: 'expand' | 'shorten' | 'examples' | 'data' | 'cta';
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

// Build a higher-quality HTML fallback when AI providers are unavailable
function buildQualityFallback(params: {
  title: string;
  keywords: string[];
  language: string;
  tone: string;
  wordCount: number;
  primaryIntent: string;
}) {
  const { title, keywords, language, primaryIntent } = params;
  const lang = (language || 'vi').toLowerCase();

  const t = (vi: string, en: string) => (lang.startsWith('vi') ? vi : en);
  const slug = (s: string) => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  const h1 = title || t('Nội dung SEO Mẫu', 'Sample SEO Content');

  // Section builders
  const sec = (h: string, body: string) => `\n<h2 id="${slug(h)}">${h}</h2>\n${body}`;
  const p = (s: string) => `<p>${s}</p>`;
  const li = (s: string) => `<li>${s}</li>`;

  const kw = [h1, ...keywords].filter(Boolean).slice(0, 8);

  // Core sections
  const intro = p(t(
    `Bài viết này cung cấp hướng dẫn thực tế về “${h1}”, tối ưu cho người đọc và công cụ tìm kiếm. Bạn sẽ nhận được quy trình từng bước, checklist nhanh và phần Hỏi–Đáp hữu ích.`,
    `This article provides a practical guide to “${h1}”, optimized for readers and search engines with step-by-step process, a quick checklist and FAQs.`
  ));

  const overview = `
  <ul>
    ${li(t('Đối tượng phù hợp: người mới bắt đầu đến trung cấp', 'Audience: beginner to intermediate'))}
    ${li(t('Mục tiêu: hiểu bản chất, biết cách triển khai đúng', 'Goals: understand the essentials and implement correctly'))}
    ${li(t('Từ khóa mục tiêu', 'Target keywords'))}: <strong>${kw.join(', ')}</strong>
  </ul>`;

  const process = `
  <h3>${t('Quy trình đề xuất', 'Suggested process')}</h3>
  <ol>
    <li>${t('Nghiên cứu từ khóa và ý định tìm kiếm', 'Research keywords and search intent')}</li>
    <li>${t('Lập dàn ý theo H2/H3, chèn keyword tự nhiên', 'Outline with H2/H3 and insert keywords naturally')}</li>
    <li>${t('Viết phần mở đầu trả lời nhanh “câu hỏi chính”', 'Write an intro that quickly answers the main question')}</li>
    <li>${t('Bổ sung ví dụ, bảng, checklist', 'Add examples, tables, and a checklist')}</li>
    <li>${t('Tối ưu meta, internal links và CTA', 'Optimize meta, internal links and CTA')}</li>
  </ol>`;

  const checklist = `
  <ul>
    ${li(t('H1 chứa từ khóa chính', 'H1 contains the primary keyword'))}
    ${li(t('Từ khóa xuất hiện ở 100 từ đầu', 'Keyword appears in the first 100 words'))}
    ${li(t('Sử dụng H2/H3 rõ ràng', 'Use clear H2/H3 structure'))}
    ${li(t('Thêm 2–3 liên kết nội bộ liên quan', 'Add 2–3 relevant internal links'))}
    ${li(t('Meta description ≤ 160 ký tự', 'Meta description ≤ 160 characters'))}
  </ul>`;

  const faqs = `
  <p><strong>1.</strong> ${t('Đây có phải là nội dung tự động không?', 'Is this auto-generated content?')}</p>
  ${p(t('Đây là phiên bản fallback khi AI không khả dụng. Nội dung vẫn được biên soạn thủ công để có thể sử dụng tham khảo.', 'This is a fallback when AI is unavailable. The content is hand-crafted to be practically useful.'))}
  <p><strong>2.</strong> ${t('Tôi có thể dùng ngay cho website?', 'Can I use this on my website?')}</p>
  ${p(t('Bạn nên hiệu chỉnh theo ngữ cảnh thương hiệu, bổ sung dữ liệu/hình ảnh riêng.', 'You should adapt it to your brand context and enrich with your own data/images.'))}
  <p><strong>3.</strong> ${t('Làm sao để tăng chất lượng nội dung?', 'How to improve content quality?')}</p>
  ${p(t('Thêm ví dụ cụ thể, case study, và trả lời trực tiếp nhu cầu người dùng.', 'Add concrete examples, case studies, and address user needs directly.'))}
  `;

  const conclusion = p(t(
    'Tóm lại, hãy tập trung vào giá trị thực tế cho người dùng và tối ưu kỹ thuật SEO một cách tự nhiên.',
    'In summary, focus on real user value and natural SEO best practices.'
  ));

  // Build body and TOC
  const headings = [
    t('Giới thiệu', 'Introduction'),
    t('Tổng quan', 'Overview'),
    t('Quy trình đề xuất', 'Suggested process'),
    t('Checklist nhanh', 'Quick checklist'),
    'FAQ',
    t('Kết luận', 'Conclusion')
  ];

  const toc = `<h2 id="${slug(t('Mục lục', 'Table of contents'))}">${t('Mục lục', 'Table of contents')}</h2><ul>${headings.map(h => `<li><a href="#${slug(h)}">${h}</a></li>`).join('')}</ul>`;

  const html = `
  <h1>${h1}</h1>
  ${toc}
  <h2 id="${slug(headings[0])}">${headings[0]}</h2>
  ${intro}
  <h2 id="${slug(headings[1])}">${headings[1]}</h2>
  ${overview}
  <h2 id="${slug(headings[2])}">${headings[2]}</h2>
  ${process}
  <h2 id="${slug(headings[3])}">${headings[3]}</h2>
  ${checklist}
  <h2 id="${slug(headings[4])}">${headings[4]}</h2>
  ${faqs}
  <h2 id="${slug(headings[5])}">${headings[5]}</h2>
  ${conclusion}
  `;

  const meta = t(
    `Hướng dẫn toàn diện về ${h1}. Quy trình, checklist, FAQ và mẹo SEO thực tế.`,
    `Comprehensive guide to ${h1} with process, checklist, FAQ and practical SEO tips.`
  ).slice(0, 160);

  const seoScore = 86; // heuristic
  const keywordDensity = '1.4%';

  return {
    title: h1,
    metaDescription: meta,
    content: html,
    headings: [h1, ...headings],
    keywordDensity,
    seoScore
  };
}

// Helper: fetch with timeout to avoid hanging on external providers
async function fetchWithTimeout(resource: string | URL, options: RequestInit & { timeoutMs?: number } = {}) {
  const { timeoutMs = 10000, ...rest } = options as any;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // @ts-ignore Deno RequestInit supports signal
    const res = await fetch(resource, { ...(rest as any), signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

serve(async (req) => {
  const hdrReqId = req.headers.get('x-request-id') || req.headers.get('x-requestid') || '';
  const reqId = hdrReqId || ((globalThis.crypto?.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random()}`);
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

    const { title, keywords = [], language, tone, wordCount, intents, outline = [], brandVoicePreset = '', brandCustomStyle = '', sectionDepth = 'standard', regenerateSection, regenerateAction } = requestData;

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
        // Prefer OpenAI if available; if it fails and Gemini exists, try Gemini, and vice versa.
        if (!fallbackOnly && openAIApiKey) {
          try {
            const intentResponse = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openAIApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: 'You are an SEO expert. Return only valid JSON without any markdown formatting or additional text.' },
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
            rawContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            intentAnalysis = JSON.parse(rawContent);
          } catch (firstErr) {
            if (!fallbackOnly && geminiApiKey) {
              const mdl = contentModel.startsWith('gemini:') ? contentModel.split(':')[1] : 'gemini-pro';
              const url = `https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${geminiApiKey}`;
              const res = await fetchWithTimeout(url, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
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
              throw firstErr;
            }
          }
        } else if (!fallbackOnly && geminiApiKey) {
          try {
            const mdl = contentModel.startsWith('gemini:') ? contentModel.split(':')[1] : 'gemini-pro';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${geminiApiKey}`;
            const res = await fetchWithTimeout(url, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
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
          } catch (firstErr) {
            if (!fallbackOnly && openAIApiKey) {
              const intentResponse = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: 'gpt-4o-mini',
                  messages: [ { role: 'system', content: 'You are an SEO expert. Return only valid JSON without any markdown formatting or additional text.' }, { role: 'user', content: intentPrompt } ],
                  max_tokens: 1000, temperature: 0.3,
                }),
              });
              if (!intentResponse.ok) throw new Error(await intentResponse.text());
              const intentData = await intentResponse.json();
              let rawContent = intentData.choices[0].message.content;
              rawContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              intentAnalysis = JSON.parse(rawContent);
            } else {
              throw firstErr;
            }
          }
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

const customOutline = Array.isArray(outline) && outline.length > 0 ? `\nCustom Outline (use EXACTLY these as H2/H3):\n${outline.map((h, i) => `${i+1}. ${h}`).join('\n')}` : '';
const isStrictOutlineMode = Array.isArray(outline) && outline.length > 0 && Boolean(requestData.strictOutline);
    const depthMap: Record<string, string> = { basic: '1–2', standard: '2–3', deep: '3–5' };
    const paragraphsPerSection = depthMap[sectionDepth] || '2–3';
    const brandVoiceText = `${brandVoicePreset ? `\nBrand voice preset: ${brandVoicePreset}.` : ''}${brandCustomStyle ? `\nBrand guidelines: ${brandCustomStyle}.` : ''}`;

    // If regenerate only one section
    if (regenerateSection && regenerateSection.trim().length > 0) {
      const sec = regenerateSection.trim();
      const slug = sec.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      let actionDirectives = '';
      switch (regenerateAction) {
        case 'expand':
          actionDirectives = `Increase depth: add 1-2 more paragraphs with new insights. Avoid repeating previous sentences.`;
          break;
        case 'shorten':
          actionDirectives = `Condense the section by removing fluff: keep 1-2 key paragraphs and a concise summary.`;
          break;
        case 'examples':
          actionDirectives = `Add practical examples: include bullets with real-world scenarios and step-by-step guidance.`;
          break;
        case 'data':
          actionDirectives = `Add supporting data: include 2-3 stats with source names (text only), and a short interpretation.`;
          break;
        case 'cta':
          actionDirectives = `Strengthen CTA: add a clear call-to-action with a styled HTML <a> button and 2-3 bullet reasons to act now.`;
          break;
      }
      const sectionPrompt = `Write HTML content ONLY for the section heading: "${sec}".\nLanguage: ${language}. Tone: ${tone}.${brandVoiceText}\nFor this section, write ${paragraphsPerSection} paragraphs of concrete, helpful information with examples and action steps. ${actionDirectives}\nReturn ONLY valid JSON as: { "sectionHtml": "<h2 id=\"${slug}\">${sec}</h2>..." }`;

      try {
        if (!fallbackOnly && openAIApiKey) {
          const r = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'Return only valid JSON.' },
                { role: 'user', content: sectionPrompt }
              ],
              temperature: 0.4,
              max_tokens: 800
            }),
          });
          if (!r.ok) throw new Error(await r.text());
          const j = await r.json();
          let raw = j.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(raw);
return new Response(JSON.stringify({ success: true, sectionHtml: parsed.sectionHtml, timestamp: new Date().toISOString(), requestId: reqId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      } catch (e) {
        log('warn', 'regenerate_section_failed', { error: String(e) });
        let hint = 'Nội dung chi tiết với ví dụ và bước hành động.';
        if (regenerateAction === 'cta') hint = '<p><a href="#" style="display:inline-block;padding:8px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Đăng ký ngay</a></p><ul><li>Lý do 1</li><li>Lý do 2</li></ul>';
        const fallbackHtml = `<h2 id=\"${slug}\">${sec}</h2>${hint}`;
return new Response(JSON.stringify({ success: true, sectionHtml: fallbackHtml, timestamp: new Date().toISOString(), requestId: reqId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    const noOutlineStructure = [
      '  - Introduction (1–2 paragraphs with the main keyword)',
      '  - 3–6 main H2 sections, each with H3 as needed (each section 2–4 paragraphs)',
      '  - FAQ section with at least 3 Q&A',
      '  - Conclusion with a clear call-to-action',
    ].join('\n');
    const structureBlock = customOutline ? '' : ('\n' + noOutlineStructure + '\n');

    const contentPrompt = `Create an SEO-optimized HTML ARTICLE for: "${title}"

Primary Intent: ${intentAnalysis.primaryIntent}
Target Keywords: ${[title, ...keywords, ...intentAnalysis.keywordClusters].join(', ')}
Language: ${language}
Tone: ${tone}
Target Word Count: ${wordCount}
${customOutline}

WRITING DIRECTIVES (MANDATORY):
- Produce a FULL ARTICLE, not an outline.
- Output HTML only in the "content" field; include <h1>, <h2>/<h3>, and <p> paragraphs.
- For EACH H2/H3 section, write ${paragraphsPerSection} paragraphs, each 3–6 sentences, with concrete tips, examples, and action steps.
- If Custom Outline is present, keep headings EXACTLY as provided. Do NOT invent extra H2 that are not in the outline.
- If NO custom outline is provided, you MUST create a complete structure and write the article body (not a bullet outline). Use this structure:
${structureBlock}- Avoid outline-only responses or bullet-only content. Bulleted/numbered lists are allowed only for checklists, processes, or FAQs within sections; the core body MUST be paragraphs.
- Use Vietnamese when language=vi.${brandVoiceText}
- Aim for at least the Target Word Count. Do not return less than ~90% of the target length.
- Avoid generic filler like "Content will be generated here".

SEO Requirements:
- Include the primary keyword in the title and the first paragraph
- Keep keyword density roughly 1–2% (natural usage)
- Use H2/H3 headings with related keywords
- Provide a meta description (<= 160 characters)
- Suggest 2–3 internal links near the end

Return ONLY valid JSON exactly as:
{
  "title": "SEO optimized title",
  "metaDescription": "Meta description <= 160 chars (single line, no quotes)",
  "content": "Full HTML content with proper headings (HTML only)",
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
let providerUsed: 'openai' | 'gemini' | 'fallback' = 'fallback';

    // Strict outline mode: generate per section and assemble, avoiding extra headings
    if (isStrictOutlineMode) {
      try {
        const sections: string[] = [];
        for (const sec of outline) {
          const heading = String(sec || '').trim();
          if (!heading) continue;
          const slug = heading.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
          const sectionPrompt = `Write HTML content ONLY for the section heading: "${heading}".\nLanguage: ${language}. Tone: ${tone}.${brandVoiceText}\nFor this section, write ${paragraphsPerSection} paragraphs of concrete, helpful information with examples and action steps.\nReturn ONLY valid JSON as: { "sectionHtml": "<h2 id=\"${slug}\">${heading}</h2>..." }`;

          if (!fallbackOnly && openAIApiKey) {
            const r = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: 'Return only valid JSON.' },
                  { role: 'user', content: sectionPrompt }
                ],
                temperature: 0.4,
                max_tokens: 800
              }),
            });
            if (!r.ok) throw new Error(await r.text());
            const j = await r.json();
            let raw = j.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(raw);
            sections.push(parsed.sectionHtml);
            providerUsed = 'openai';
          } else if (!fallbackOnly && geminiApiKey) {
            const mdl = contentModel.startsWith('gemini:') ? contentModel.split(':')[1] : 'gemini-pro';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${geminiApiKey}`;
            const res = await fetchWithTimeout(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: sectionPrompt }] }] })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleaned);
            sections.push(parsed.sectionHtml);
            providerUsed = 'gemini';
          } else {
            // Fallback: minimal section
            sections.push(`<h2 id=\"${slug}\">${heading}</h2><p>Nội dung chi tiết theo outline.</p>`);
          }
        }

        const h1 = title || 'Nội dung SEO';
        const body = `<h1>${h1}</h1>\n${sections.join('\n')}`;
        const meta = (`Bài viết theo outline về ${h1}`).slice(0, 160);
        generatedContent = {
          title: h1,
          metaDescription: meta,
          content: body,
          headings: [h1, ...outline],
          keywordDensity: (keywords && keywords[0]) ? String(keywords[0]) : '1.5%',
          seoScore: 86
        };
      } catch (e) {
        log('warn', 'strict_outline_generation_failed', { reqId, error: String(e) });
        // fallback to normal path below
      }
    }

    if (!generatedContent) {

    try {
      // Prefer OpenAI if available; if it fails and Gemini exists, try Gemini (and vice versa)
      if (!fallbackOnly && openAIApiKey) {
        try {
          const contentResponse = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'You are an expert SEO content writer. Create high-quality, optimized content that ranks well. Return only valid JSON without any markdown formatting or additional text.' },
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
          let rawContent = contentData.choices[0].message.content;
          rawContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          generatedContent = JSON.parse(rawContent);
          providerUsed = 'openai';
        } catch (firstErr) {
          if (!fallbackOnly && geminiApiKey) {
            const mdl = contentModel.startsWith('gemini:') ? contentModel.split(':')[1] : 'gemini-pro';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${geminiApiKey}`;
            const res = await fetch(url, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
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
            providerUsed = 'gemini';
          } else {
            throw firstErr;
          }
        }
      } else if (!fallbackOnly && geminiApiKey) {
        try {
          const mdl = contentModel.startsWith('gemini:') ? contentModel.split(':')[1] : 'gemini-pro';
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${geminiApiKey}`;
          const res = await fetch(url, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
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
          providerUsed = 'gemini';
        } catch (firstErr) {
          if (!fallbackOnly && openAIApiKey) {
            const contentResponse = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'gpt-4o-mini', messages: [ { role: 'system', content: 'You are an expert SEO content writer. Create high-quality, optimized content that ranks well. Return only valid JSON without any markdown formatting or additional text.' }, { role: 'user', content: contentPrompt } ], max_tokens: 2000, temperature: 0.4,
              }),
            });
            if (!contentResponse.ok) throw new Error(await contentResponse.text());
            const contentData = await contentResponse.json();
            let rawContent = contentData.choices[0].message.content;
            rawContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            generatedContent = JSON.parse(rawContent);
            providerUsed = 'openai';
          } else {
            throw firstErr;
          }
        }
      } else {
        throw new Error('No AI provider available for content');
      }
    } catch (error) {
      log('warn', 'content_generation_error', { reqId, error: String(error) });
      // Fallback content (high-quality structured HTML)
      const fallback = buildQualityFallback({
        title,
        keywords,
        language,
        tone,
        wordCount,
        primaryIntent: String(intentAnalysis?.primaryIntent || 'Informational')
      });
      if (Array.isArray(outline) && outline.length > 0) {
        // Inject outline headings at top if provided
        const heads = outline.slice(0, 8);
        const list = heads.map(h => `<li><a href="#${h.toLowerCase().replace(/[^a-z0-9\s-]/gi,'').trim().replace(/\s+/g,'-')}">${h}</a></li>`).join('');
        fallback.content = fallback.content.replace('<h2 id="muc-luc">Mục lục</h2><ul>', `<h2 id="muc-luc">Mục lục</h2><ul>${list}`);
        // Also ensure headings array contains custom outline
        fallback.headings = [fallback.title, ...heads];
      }
      generatedContent = fallback;
      providerUsed = 'fallback';
    }

    }

    // Normalize output
    const normalized = (() => {
      const resp = {
        intentAnalysis,
        content: generatedContent,
        success: true,
        timestamp: new Date().toISOString(),
        providerUsed,
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

          // Ensure every H2 has an id based on its text
          try {
            updatedHtml = updatedHtml.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (match, attrs, inner) => {
              if (/id=/i.test(attrs)) return match;
              const text = String(inner).replace(/<[^>]+>/g, '').trim();
              const id = slug(text);
              return `<h2 id="${id}"${attrs}>${inner}</h2>`;
            });
          } catch { /* noop */ }

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
      if (!isStrictOutlineMode) ensureIntentFeatures();

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

const response = { ...normalized, requestId: reqId };

log('info', 'generate_content_success', { reqId });
return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    log('error', 'generate_content_unhandled_error', { error: String(error) });
return new Response(
      JSON.stringify({ 
        error: 'Content generation failed', 
        details: (error as any).message,
        success: false,
        requestId: reqId
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});