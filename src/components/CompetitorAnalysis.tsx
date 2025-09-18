import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, ExternalLink, TrendingUp, Target, Eye } from "lucide-react";

interface CompetitorData {
  url: string;
  title: string;
  contentLength: number;
  keywordCount: number;
  readabilityScore: number;
  seoScore: number;
  traffic: string;
  rank: number;
}

export function CompetitorAnalysis() {
  const [searchQuery, setSearchQuery] = useState("");
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock competitor data for demonstration
  const mockCompetitors: CompetitorData[] = [
    {
      url: "example1.com",
      title: "Complete SEO Guide 2024",
      contentLength: 2500,
      keywordCount: 45,
      readabilityScore: 85,
      seoScore: 92,
      traffic: "50K/month",
      rank: 1
    },
    {
      url: "example2.com", 
      title: "SEO Best Practices",
      contentLength: 1800,
      keywordCount: 32,
      readabilityScore: 78,
      seoScore: 88,
      traffic: "35K/month",
      rank: 2
    },
    {
      url: "example3.com",
      title: "Advanced SEO Techniques",
      contentLength: 3200,
      keywordCount: 58,
      readabilityScore: 90,
      seoScore: 95,
      traffic: "75K/month", 
      rank: 3
    }
  ];

  const analyzeCompetitors = async () => {
    setIsAnalyzing(true);
    // Simulate API call
    setTimeout(() => {
      setCompetitors(mockCompetitors);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "default";
    if (score >= 70) return "secondary";
    return "destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Phân Tích Đối Thủ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            placeholder="Nhập từ khóa để phân tích đối thủ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            onClick={analyzeCompetitors}
            disabled={isAnalyzing || !searchQuery.trim()}
          >
            <Search className="w-4 h-4" />
            {isAnalyzing ? "Đang phân tích..." : "Phân tích"}
          </Button>
        </div>

        {competitors.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              Tìm thấy {competitors.length} đối thủ hàng đầu
            </div>

            {competitors.map((competitor, index) => (
              <Card key={index} className="shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          #{competitor.rank}
                        </Badge>
                        <h4 className="font-semibold text-sm">{competitor.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{competitor.url}</span>
                        <Button variant="ghost" size="sm" className="h-auto p-0">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getScoreBadge(competitor.seoScore)}>
                        SEO: {competitor.seoScore}%
                      </Badge>
                      <Badge variant="secondary">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {competitor.traffic}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Độ dài nội dung:</span>
                        <span className="font-medium">{competitor.contentLength} từ</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>Số từ khóa:</span>
                        <span className="font-medium">{competitor.keywordCount}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Readability:</span>
                          <span className={`font-medium ${getScoreColor(competitor.readabilityScore)}`}>
                            {competitor.readabilityScore}%
                          </span>
                        </div>
                        <Progress value={competitor.readabilityScore} className="h-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 text-sm">📊 Insights & Recommendations</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>• Độ dài nội dung trung bình: {Math.round(competitors.reduce((sum, c) => sum + c.contentLength, 0) / competitors.length)} từ</p>
                  <p>• SEO Score trung bình: {Math.round(competitors.reduce((sum, c) => sum + c.seoScore, 0) / competitors.length)}%</p>
                  <p>• Để cạnh tranh hiệu quả, nội dung của bạn nên có ít nhất {Math.max(...competitors.map(c => c.contentLength)) + 200} từ</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}