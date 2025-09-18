import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, XCircle, TrendingUp } from "lucide-react";

interface SeoScoreCardProps {
  content: string;
  title: string;
  keywords: string[];
}

interface SeoMetric {
  name: string;
  score: number;
  status: 'good' | 'warning' | 'poor';
  description: string;
}

export function SeoScoreCard({ content, title, keywords }: SeoScoreCardProps) {
  // Mock SEO analysis - in real app this would use actual SEO analysis
  const calculateSeoMetrics = (): SeoMetric[] => {
    const wordCount = content.split(' ').length;
    const hasH1 = content.includes('# ') || title.length > 0;
    const keywordDensity = keywords.length > 0 ? 
      keywords.reduce((total, keyword) => {
        const occurrences = content.toLowerCase().split(keyword.toLowerCase()).length - 1;
        return total + occurrences;
      }, 0) / wordCount * 100 : 0;
    
    return [
      {
        name: "Độ dài nội dung",
        score: Math.min(Math.max(wordCount / 300 * 100, 20), 100),
        status: wordCount >= 300 ? 'good' : wordCount >= 150 ? 'warning' : 'poor',
        description: `${wordCount} từ (khuyến nghị: 300+ từ)`
      },
      {
        name: "Tiêu đề (H1)",
        score: hasH1 ? 100 : 0,
        status: hasH1 ? 'good' : 'poor',
        description: hasH1 ? "Có tiêu đề chính" : "Thiếu tiêu đề H1"
      },
      {
        name: "Mật độ từ khóa",
        score: keywordDensity > 0.5 && keywordDensity < 3 ? 100 : keywordDensity > 3 ? 60 : 40,
        status: keywordDensity > 0.5 && keywordDensity < 3 ? 'good' : keywordDensity > 3 ? 'warning' : 'poor',
        description: `${keywordDensity.toFixed(1)}% (khuyến nghị: 0.5-3%)`
      },
      {
        name: "Readability",
        score: 85,
        status: 'good',
        description: "Dễ đọc và hiểu"
      }
    ];
  };

  const metrics = calculateSeoMetrics();
  const overallScore = Math.round(metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'poor':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            SEO Score
          </CardTitle>
          <Badge variant={getScoreBadgeVariant(overallScore)} className="text-lg px-3 py-1">
            {overallScore}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(metric.status)}
                  <span className="font-medium text-sm">{metric.name}</span>
                </div>
                <span className={`text-sm font-semibold ${getScoreColor(metric.score)}`}>
                  {Math.round(metric.score)}%
                </span>
              </div>
              <Progress value={metric.score} className="h-2" />
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Điểm SEO tổng thể</p>
            <div className="flex justify-center">
              <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
              <div className="text-lg text-muted-foreground">/100</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}