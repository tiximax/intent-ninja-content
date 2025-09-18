import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Target,
  Hash,
  Clock,
  Eye,
  Zap
} from "lucide-react";

interface ContentAnalysis {
  score: number;
  wordCount: number;
  readabilityScore: number;
  keywordDensity: number;
  headingStructure: {
    h1: number;
    h2: number;
    h3: number;
  };
  issues: {
    type: 'error' | 'warning' | 'info';
    message: string;
    fix: string;
  }[];
  suggestions: string[];
  targetKeywords: string[];
  semanticKeywords: string[];
}

export function ContentOptimization() {
  const [content, setContent] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);

  const analyzeContent = async () => {
    if (!content.trim()) return;
    
    setIsAnalyzing(true);
    
    // Mock analysis - in real app, this would call an AI service
    setTimeout(() => {
      const mockAnalysis: ContentAnalysis = {
        score: 78,
        wordCount: content.split(/\s+/).length,
        readabilityScore: 72,
        keywordDensity: 2.3,
        headingStructure: {
          h1: (content.match(/^#\s/gm) || []).length,
          h2: (content.match(/^##\s/gm) || []).length,
          h3: (content.match(/^###\s/gm) || []).length,
        },
        issues: [
          {
            type: 'warning',
            message: 'Thiếu target keyword trong H1',
            fix: 'Thêm từ khóa chính vào tiêu đề H1'
          },
          {
            type: 'error',
            message: 'Meta description quá ngắn',
            fix: 'Mở rộng meta description đến 150-160 ký tự'
          },
          {
            type: 'info',
            message: 'Có thể thêm internal links',
            fix: 'Thêm 2-3 internal links đến nội dung liên quan'
          }
        ],
        suggestions: [
          'Thêm FAQ section để target featured snippets',
          'Sử dụng bullet points để tăng readability',
          'Thêm hình ảnh với alt text có từ khóa',
          'Tối ưu hóa cho voice search với câu hỏi tự nhiên'
        ],
        targetKeywords: [targetKeyword, `${targetKeyword} 2024`, `cách ${targetKeyword}`],
        semanticKeywords: ['tối ưu hóa', 'cải thiện', 'hiệu quả', 'chuyên nghiệp']
      };
      
      setAnalysis(mockAnalysis);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Content Optimization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Target Keyword</label>
            <input
              type="text"
              className="w-full mt-1 px-3 py-2 border border-input rounded-md"
              placeholder="Nhập từ khóa chính..."
              value={targetKeyword}
              onChange={(e) => setTargetKeyword(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Content to Analyze</label>
            <Textarea
              placeholder="Paste your content here for SEO analysis..."
              className="min-h-[200px] mt-1"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={analyzeContent}
            disabled={isAnalyzing || !content.trim()}
            className="w-full"
          >
            {isAnalyzing ? "Đang phân tích..." : "Phân tích nội dung"}
          </Button>
        </div>

        {analysis && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>
                      {analysis.score}/100
                    </div>
                    <p className="text-sm text-muted-foreground">SEO Score</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4" />
                      <span className="text-sm font-medium">Word Count</span>
                    </div>
                    <div className="text-2xl font-bold">{analysis.wordCount}</div>
                    <div className="text-xs text-muted-foreground">
                      {analysis.wordCount < 300 ? "Too short" : 
                       analysis.wordCount > 2000 ? "Good length" : "Adequate"}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">Readability</span>
                    </div>
                    <div className="text-2xl font-bold">{analysis.readabilityScore}%</div>
                    <Progress value={analysis.readabilityScore} className="h-2 mt-1" />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Heading Structure</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>H1 Tags:</span>
                      <Badge variant={analysis.headingStructure.h1 === 1 ? "default" : "destructive"}>
                        {analysis.headingStructure.h1}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>H2 Tags:</span>
                      <Badge variant="secondary">{analysis.headingStructure.h2}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>H3 Tags:</span>
                      <Badge variant="secondary">{analysis.headingStructure.h3}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="issues" className="space-y-4">
              {analysis.issues.map((issue, index) => (
                <Card key={index} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{issue.message}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{issue.fix}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {issue.type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="keywords" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Target Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.targetKeywords.map((keyword, index) => (
                      <Badge key={index} variant="default">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 text-sm">
                    <span className="text-muted-foreground">Keyword Density: </span>
                    <span className={`font-medium ${
                      analysis.keywordDensity < 1 ? "text-red-600" :
                      analysis.keywordDensity > 3 ? "text-red-600" : "text-green-600"
                    }`}>
                      {analysis.keywordDensity}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Semantic Keywords</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Add these related terms to improve topical relevance:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.semanticKeywords.map((keyword, index) => (
                      <Badge key={index} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              {analysis.suggestions.map((suggestion, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Zap className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm">{suggestion}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card className="bg-blue-50 dark:bg-blue-900/10">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">💡 Pro Tips</h4>
                  <div className="space-y-1 text-sm">
                    <p>• Aim for 1,500-2,500 words for comprehensive coverage</p>
                    <p>• Use target keyword in first 100 words</p>
                    <p>• Include LSI keywords naturally throughout content</p>
                    <p>• Add table of contents for long-form content</p>
                    <p>• Optimize for featured snippets with clear answers</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}