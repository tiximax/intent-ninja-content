import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sparkles, FileText, Download, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useContentGeneration } from "@/hooks/useContentGeneration";

export default function ContentGeneratorForm() {
  const { generateContent, isGenerating, generatedContent, intentAnalysis } = useContentGeneration();
  const mockMode = String(((import.meta as any).env?.VITE_USE_MOCK_CONTENT ?? '')).toLowerCase() === 'true';
  
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [language, setLanguage] = useState("vi");
  const [tone, setTone] = useState("educational");
  const [wordCount, setWordCount] = useState([800]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề");
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
      wordCount: wordCount[0]
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
    <div className="space-y-6">
      <Card className="border-accent/20">
<CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Content Generator
          </CardTitle>
          <CardDescription>
            Tạo nội dung SEO tối ưu với phân tích search intent thông minh
            {mockMode && (
              <Badge variant="outline" className="ml-2">Mock Mode</Badge>
            )}
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
                required
              />
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
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo nội dung...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Tạo nội dung AI
                </>
              )}
            </Button>
          </form>
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
                      <li key={index} className="flex items-center">
                        <span className="mr-2">•</span>
                        {heading}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}