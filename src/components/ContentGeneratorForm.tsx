import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sparkles, FileText, Download, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useContentGeneration } from "@/hooks/useContentGeneration";
import { useProjectManager } from "@/hooks/useProjectManager";
import { ContentErrorBoundary } from "@/components/ui/error-boundary";
import { ContentLoadingState, ExportLoadingState, SearchLoadingState } from "@/components/ui/loading";
import { ValidationError, useFormValidation } from "@/components/ui/form-error";

export default function ContentGeneratorForm() {
  const { generateContent, regenerateSection, undoSection, redoSection, getCurrentSectionHtml, getLastSnapshot, isGenerating, isExpanding, cancelExpansion, generatedContent, intentAnalysis } = useContentGeneration();
  const { currentProject } = useProjectManager();
  const mockMode = String(((import.meta as any).env?.VITE_USE_MOCK_CONTENT ?? '')).toLowerCase() === 'true';
  
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [language, setLanguage] = useState("vi");
  const [tone, setTone] = useState("educational");
  const [brandVoice, setBrandVoice] = useState("professional");
  const [brandCustom, setBrandCustom] = useState("");
  const [sectionDepth, setSectionDepth] = useState("deep");
  const [industryPreset, setIndustryPreset] = useState("general");
  const [wordCount, setWordCount] = useState([800]);
  const [outlineInput, setOutlineInput] = useState("");
  const [outline, setOutline] = useState<string[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const { validateTitle } = useFormValidation();
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffPrev, setDiffPrev] = useState('');
  const [diffCurr, setDiffCurr] = useState('');
  const [diffHeading, setDiffHeading] = useState('');

  // Persist draft so Dashboard big button can use current form/outline
  const applyIndustryPreset = (preset: string) => {
    setIndustryPreset(preset);
    if (preset === 'ecommerce') {
      setBrandVoice('direct');
      setSectionDepth('deep');
      setBrandCustom('TMĐT: Tập trung chuyển đổi. Mở đầu nêu lợi ích rõ ràng; dùng bullet lợi ích/điểm khác biệt; chèn CTA “Mua ngay/Đặt hàng”; thêm FAQ về vận chuyển/đổi trả; tránh thuật ngữ phức tạp.');
    } else if (preset === 'saas_b2b') {
      setBrandVoice('professional');
      setSectionDepth('deep');
      setBrandCustom('SaaS B2B: Pain → Solution → ROI. Dùng số liệu, case ngắn, KPI rõ; CTA “Dùng thử/Demo”; giọng chuyên nghiệp, data-driven; tránh hứa suông.');
    } else if (preset === 'education') {
      setBrandVoice('educational');
      setSectionDepth('standard');
      setBrandCustom('Giáo dục: Giải thích khái niệm rõ ràng; hướng dẫn từng bước; ví dụ gần gũi; ngôn ngữ đơn giản; tổng kết “bạn học được gì”.');
    } else if (preset === 'ordership_tiximax') {
      setBrandVoice('professional');
      setSectionDepth('deep');
      setBrandCustom('TIXIMAX – “Cầu nối thương mại và Tài chính” cho giao thương quốc tế (Indo, Nhật, Hàn, Mỹ → Việt Nam). Không chỉ logistics mà là đối tác chiến lược giúp cá nhân/doanh nghiệp Việt gỡ rào cản để vươn ra biển lớn.\n\nLợi thế cạnh tranh:\n• Uy tín & Minh bạch: nguồn hàng chính hãng, giá rõ ràng, không phụ phí ẩn\n• Tốc độ & An toàn: mua hàng/vận chuyển nhanh, đảm bảo an toàn\n• Tiện lợi & Đa dạng: đặt mua từ nhiều quốc gia, nhiều website\n• Tối ưu Chi phí: tư vấn phương án tiết kiệm, ghép đơn\n• Hỗ trợ Toàn diện: tư vấn – đổi trả – xử lý khiếu nại nhanh\n\nGiọng điệu & Văn phong:\n• Đáng tin cậy & Chuyên nghiệp: từ ngữ rõ, chính xác, dễ hiểu\n• Thân thiện & Gần gũi: xưng “bạn”, có thể chèn emoji khi phù hợp\n• Tươi trẻ & Năng động: câu ngắn gọn, động từ mạnh, ví dụ “trend” khi tạo nội dung social\n\nGợi ý nhận diện (tham khảo khi xuất HTML/landing): màu chủ đạo vàng #f6b92d + đen/trắng; CTA xanh dương; bố cục có border vàng, khung bo tròn; font Noto Sans (body) + Inter SemiBold (heading).\n\nCTA mẫu: “Đặt order ngay”, “Nhận tư vấn tối ưu chi phí”, “Theo dõi đơn minh bạch”');
    }
  };

  useEffect(() => {
    // Auto-fill custom guideline when choosing "Thương hiệu của tôi"
    if (brandVoice === 'mybrand' && !brandCustom) {
      setBrandCustom('Giọng điệu: gần gũi nhưng chuyên nghiệp; ưu tiên ví dụ thực tế trong ngành; câu ngắn, trực diện; có bullet và các bước hành động; tránh thuật ngữ khó, giải thích đơn giản; thêm số liệu khi có.');
    }
  }, [brandVoice]);

  // Prefill from project brand defaults
  useEffect(() => {
    try {
      if (!currentProject) return;
      const raw = localStorage.getItem(`brand-defaults-${currentProject.id}`);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.brandVoicePreset) setBrandVoice(d.brandVoicePreset);
      if (d.sectionDepth) setSectionDepth(d.sectionDepth);
      if (d.brandCustomStyle) setBrandCustom(d.brandCustomStyle);
      if (d.industryPreset) applyIndustryPreset(d.industryPreset);
    } catch {}
  }, [currentProject]);

  useEffect(() => {
    try {
      const draft = {
        title,
        keywords,
        language,
        tone,
        wordCount: wordCount[0],
        outline,
        brandVoicePreset: brandVoice,
        brandCustomStyle: brandCustom,
        sectionDepth,
        industryPreset,
      };
      localStorage.setItem('content-generator-draft', JSON.stringify(draft));
    } catch {}
  }, [title, keywords, language, tone, wordCount, outline, brandVoice, brandCustom, sectionDepth, industryPreset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateTitle(title);
    if (error) {
      setTitleError(error);
      const el = document.getElementById('title');
      if (el) el.focus();
      return;
    } else {
      setTitleError(null);
    }

    const keywordArray = keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    await generateContent({
      title: title.trim(),
      keywords: keywordArray,
      language,
      tone,
      wordCount: wordCount[0],
      outline: outline.length ? outline : undefined,
      brandVoicePreset: brandVoice,
      brandCustomStyle: brandCustom,
      sectionDepth: sectionDepth as any,
    });
  };

  const exportToHTML = () => {
    if (!generatedContent) return;
    
    const htmlContent = `<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${generatedContent.title}</title>
    <meta name="description" content="${generatedContent.metaDescription}">
</head>
<body>
    ${generatedContent.content}
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToMarkdown = () => {
    if (!generatedContent) return;
    
    // Convert HTML to markdown (basic conversion)
    const markdownContent = generatedContent.content
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<[^>]*>/g, ''); // Remove remaining HTML tags
    
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ContentErrorBoundary>
      <div className="space-y-6">
        <Card className="border-accent/20" data-testid="content-generator-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Content Generator
              </CardTitle>
              {mockMode && (
                <Badge variant="outline" className="ml-2">Mock Mode</Badge>
              )}
            </div>
            <CardDescription>
              Tạo nội dung SEO tối ưu với phân tích search intent thông minh
            </CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề / Từ khóa chính</Label>
              <Input
                id="title"
                placeholder="VD: Cách tối ưu SEO cho website"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-invalid={!!titleError}
                aria-describedby={titleError ? 'title-error' : undefined}
                required
              />
              {titleError && (
                <div id="title-error" className="pt-1">
                  <ValidationError field="Tiêu đề" message={titleError} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Từ khóa phụ (cách nhau bằng dấu phẩy)</Label>
              <Textarea
                id="keywords"
                placeholder="SEO onpage, tối ưu website, tăng traffic"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngôn ngữ</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tone viết</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="educational">Giáo dục</SelectItem>
                    <SelectItem value="persuasive">Thuyết phục</SelectItem>
                    <SelectItem value="conversational">Gần gũi</SelectItem>
                    <SelectItem value="professional">Chuyên nghiệp</SelectItem>
                    <SelectItem value="technical">Kỹ thuật</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Số từ mục tiêu: {wordCount[0]} từ</Label>
              <Slider
                value={wordCount}
                onValueChange={setWordCount}
                max={3000}
                min={300}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>300 từ</span>
                <span>3000 từ</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className="space-y-2">
                  <Label>Brand voice preset</Label>
                  <Select value={brandVoice} onValueChange={setBrandVoice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Chuyên nghiệp</SelectItem>
                      <SelectItem value="friendly">Thân thiện</SelectItem>
                      <SelectItem value="authoritative">Định hướng/Authority</SelectItem>
                      <SelectItem value="storytelling">Kể chuyện</SelectItem>
                      <SelectItem value="direct">Ngắn gọn - trực diện</SelectItem>
                      <SelectItem value="mybrand">Thương hiệu của tôi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Độ sâu mỗi mục (H2/H3)</Label>
                  <Select value={sectionDepth} onValueChange={setSectionDepth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Cơ bản (1–2 đoạn)</SelectItem>
                      <SelectItem value="standard">Chuẩn (2–3 đoạn)</SelectItem>
                      <SelectItem value="deep">Sâu (3–5 đoạn)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ngành (industry preset)</Label>
                  <Select value={industryPreset} onValueChange={applyIndustryPreset}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Chung (General)</SelectItem>
                      <SelectItem value="ecommerce">TMĐT / Bán hàng</SelectItem>
                      <SelectItem value="saas_b2b">SaaS B2B</SelectItem>
                      <SelectItem value="education">Giáo dục</SelectItem>
                      <SelectItem value="ordership_tiximax">Ordership – TIXIMAX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Brand voice (tùy chỉnh)</Label>
                <Textarea
                  placeholder="Ví dụ: ngôn ngữ gần gũi, ưu tiên ví dụ thực tế, tránh thuật ngữ khó; ưu tiên bullet và bước hành động."
                  value={brandCustom}
                  onChange={(e) => setBrandCustom(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ContentLoadingState />
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Tạo nội dung AI
                </>
              )}
            </Button>
            {isExpanding && (
              <Button type="button" variant="outline" onClick={cancelExpansion} className="w-full">
                Dừng mở rộng
              </Button>
            )}
          </form>

          {/* Outline Editor */}
          <div className="mt-8 space-y-3" data-testid="outline-editor">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Outline (H2/H3)</Label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  // Đề xuất outline nhanh dựa trên title/keywords
                  const seeds = [
                    'Giới thiệu',
                    'Lợi ích chính',
                    'Quy trình triển khai',
                    'Lưu ý & best practices',
                    'FAQ',
                    'Kết luận'
                  ];
                  setOutline((prev) => prev.length ? prev : seeds);
                }}
                data-testid="outline-suggest-btn"
              >
                Gợi ý outline
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Thêm mục (H2/H3)..."
                value={outlineInput}
                onChange={(e) => setOutlineInput(e.target.value)}
                data-testid="outline-input"
              />
              <Button
                type="button"
                onClick={() => {
                  if (outlineInput.trim()) {
                    setOutline((prev) => [...prev, outlineInput.trim()]);
                    setOutlineInput('');
                  }
                }}
                data-testid="outline-add-btn"
              >
                Thêm
              </Button>
            </div>

            {outline.length > 0 && (
              <ul className="space-y-2" data-testid="outline-list">
                {outline.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{idx + 1}. {item}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOutline((prev) => prev.filter((_, i) => i !== idx))}
                      data-testid={`outline-remove-${idx}`}
                    >
                      Xóa
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <Button
              type="button"
              className="w-full"
              onClick={async () => {
                if (!title.trim()) {
                  alert('Vui lòng nhập tiêu đề');
                  return;
                }
                const keywordArray = keywords
                  .split(',')
                  .map(k => k.trim())
                  .filter(k => k.length > 0);
                await generateContent({
                  title: title.trim(),
                  keywords: keywordArray,
                  language,
                  tone,
                  wordCount: wordCount[0],
                  outline: outline
                });
              }}
              disabled={isGenerating || outline.length === 0}
              data-testid="generate-from-outline"
            >
              {isGenerating ? 'Đang tạo từ outline...' : 'Tạo nội dung từ Outline'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Intent Analysis Results */}
      {intentAnalysis && (
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-lg">Phân tích Search Intent</CardTitle>
            <CardDescription>
              Primary Intent: <Badge variant="secondary">{intentAnalysis.primaryIntent}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Intent Breakdown:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {intentAnalysis.intents.map((intent) => (
                  <div key={intent.type} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{intent.type}</span>
                    <Badge variant={intent.confidence > 50 ? "default" : "outline"}>
                      {intent.confidence}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            {intentAnalysis.keywordClusters.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Keyword Clusters:</h4>
                <div className="flex flex-wrap gap-1">
                  {intentAnalysis.keywordClusters.slice(0, 8).map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {intentAnalysis.seoRecommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">SEO Recommendations:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {intentAnalysis.seoRecommendations.slice(0, 3).map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generated Content Preview */}
      {generatedContent && (
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Nội dung đã tạo</CardTitle>
              <CardDescription>
                SEO Score: <Badge variant="default">{generatedContent.seoScore}/100</Badge>
                {" • "}
                Keyword Density: <Badge variant="outline">{generatedContent.keywordDensity}</Badge>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToHTML}>
                <Download className="w-4 h-4 mr-1" />
                HTML
              </Button>
              <Button variant="outline" size="sm" onClick={exportToMarkdown}>
                <FileText className="w-4 h-4 mr-1" />
                Markdown
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Meta Description:</Label>
                <p className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                  {generatedContent.metaDescription}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Content Preview:</Label>
                <div 
                  className="mt-2 p-4 bg-background border rounded-lg prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: generatedContent.content }}
                />
              </div>

              {generatedContent.headings.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Content Structure:</Label>
                  <ul className="mt-1 text-sm text-muted-foreground space-y-1">
                    {generatedContent.headings.map((heading, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-2">•</span>
                          {heading}
                        </div>
                        {index > 0 && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => { await regenerateSection(heading); }}
                              data-testid={`regen-${index}`}
                            >Regenerate</Button>
                            <Button size="sm" variant="outline" onClick={() => regenerateSection(heading, { action: 'expand' })}>Expand</Button>
                            <Button size="sm" variant="outline" onClick={() => regenerateSection(heading, { action: 'shorten' })}>Shorten</Button>
                            <Button size="sm" variant="outline" onClick={() => regenerateSection(heading, { action: 'examples' })}>Examples</Button>
                            <Button size="sm" variant="outline" onClick={() => regenerateSection(heading, { action: 'data' })}>Data</Button>
                            <Button size="sm" variant="outline" onClick={() => regenerateSection(heading, { action: 'cta' })}>CTA</Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              const prev = (getLastSnapshot && getLastSnapshot(heading)) || '';
                              const curr = (getCurrentSectionHtml && getCurrentSectionHtml(heading)) || '';
                              if (!prev || !curr) { return; }
                              setDiffHeading(heading);
                              setDiffPrev(prev);
                              setDiffCurr(curr);
                              setDiffOpen(true);
                            }}>Diff</Button>
                            <Button size="sm" variant="outline" data-testid={`undo-${index}`} onClick={() => undoSection(heading)}>Undo</Button>
                            <Button size="sm" variant="outline" onClick={() => redoSection(heading)}>Redo</Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    {/* Diff Modal */}
    <Dialog open={diffOpen} onOpenChange={setDiffOpen}>
      {/* marker for test */}
      <div data-testid="diff-modal-marker" className="hidden" />
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>So sánh thay đổi: {diffHeading}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Trước</Label>
            <div className="border rounded p-2 text-xs font-mono max-h-96 overflow-auto" data-testid="diff-prev" dangerouslySetInnerHTML={{ __html: diffPrev }} />
          </div>
          <div>
            <Label>Sau</Label>
            <div className="border rounded p-2 text-xs font-mono max-h-96 overflow-auto" data-testid="diff-curr" dangerouslySetInnerHTML={{ __html: diffCurr }} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
      </div>
    </ContentErrorBoundary>
  );
}
