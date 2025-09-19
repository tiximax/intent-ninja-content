import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  TrendingUp, 
  Target, 
  Loader2, 
  BarChart3,
  Globe,
  Eye,
  DollarSign,
  Filter,
  Download
} from "lucide-react";
import { useKeywordResearch } from "@/hooks/useKeywordResearch";
import { AdvancedKeywordFilters, type KeywordFilters } from "./AdvancedKeywordFilters";
import { getProviderName } from "@/services/keywordsProvider";
import { SearchLoadingState, ExportLoadingState } from "@/components/ui/loading";

export default function KeywordResearchPanel() {
  const { researchKeywords, isLoading, keywordData } = useKeywordResearch();
  const [seedKeyword, setSeedKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<KeywordFilters | null>(null);
  const provider = getProviderName();

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedKeyword.trim()) return;
    
    await researchKeywords(seedKeyword.trim(), {
      language: 'vi',
      location: 'VN',
      includeVariations: true
    });
  };

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="border-accent/20">
      <CardHeader>
<CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Keyword Research
          <Badge
            data-testid="provider-badge"
            variant={provider === 'serpapi' ? 'default' : 'secondary'}
            className="ml-2"
          >
            {provider === 'serpapi' ? 'Provider: SerpApi' : 'Provider: Mock'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Phân tích từ khóa với Google Trends & Keyword Planner
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResearch} className="space-y-4 mb-6">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="seed-keyword" className="sr-only">Từ khóa gốc</Label>
              <Input
                id="seed-keyword"
                placeholder="Nhập từ khóa để nghiên cứu..."
                value={seedKeyword}
                onChange={(e) => setSeedKeyword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <SearchLoadingState />
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Research
                </>
              )}
            </Button>
          </div>
        </form>

        {showFilters && (
          <div className="mb-6">
            <AdvancedKeywordFilters
              onApplyFilters={(filters) => {
                setActiveFilters(filters);
                setShowFilters(false);
              }}
              onClearFilters={() => {
                setActiveFilters(null);
                setShowFilters(false);
              }}
            />
          </div>
        )}

        {keywordData && (
          <Tabs defaultValue="keywords" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="clusters">Clusters</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="keywords" className="space-y-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  data-testid="export-csv-btn"
                  onClick={() => {
                    if (!keywordData) return;
                    const headers = [
                      'keyword',
                      'searchVolume',
                      'competition',
                      'competitionIndex',
                      'cpc',
                      'difficulty',
                    ];
                    const rows = keywordData.keywords.map(k => [
                      k.keyword,
                      String(k.searchVolume ?? ''),
                      String(k.competition ?? ''),
                      String(k.competitionIndex ?? ''),
                      String(k.cpc ?? ''),
                      String(k.difficulty ?? ''),
                    ]);

                    const escapeCell = (v: string) => {
                      const needsQuote = /[",\n]/.test(v);
                      const safe = v.replace(/"/g, '""');
                      return needsQuote ? `"${safe}"` : safe;
                    };

                    const csv = [headers.join(','), ...rows.map(r => r.map(escapeCell).join(','))].join('\n');
                    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'keywords.csv';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 0);
                  }}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
              <div className="grid gap-4">
                {keywordData.keywords.slice(0, 10).map((keyword, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{keyword.keyword}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {formatNumber(keyword.searchVolume)}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${keyword.cpc.toFixed(2)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            KD: {keyword.difficulty}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <div className={`w-2 h-2 rounded-full mr-1 ${getCompetitionColor(keyword.competition)}`} />
                          {keyword.competition}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              {keywordData.trends.map((trend, index) => (
                <Card key={index} className="p-4">
                  <h4 className="font-medium mb-4">Search Interest: {trend.keyword}</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium mb-2">Interest Over Time</h5>
                      <div className="flex items-end gap-1 h-16">
                        {trend.interest.map((point, i) => (
                          <div
                            key={i}
                            className="bg-primary flex-1 rounded-t"
                            style={{ height: `${point.value}%` }}
                            title={`${point.date}: ${point.value}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-2">Related Topics</h5>
                      <div className="space-y-2">
                        {trend.relatedTopics.map((topic, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm">{topic.title}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={topic.value} className="w-20 h-2" />
                              <span className="text-xs text-muted-foreground">{topic.value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="clusters" className="space-y-4">
              <div className="grid gap-4">
                {keywordData.clusters.map((cluster, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{cluster.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{cluster.intent}</Badge>
                        <Badge variant="secondary">{formatNumber(cluster.volume)} searches</Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cluster.keywords.map((keyword, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              <div className="grid gap-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Long-tail Keywords</h4>
                  <div className="space-y-2">
                    {keywordData.suggestions.longtail.map((keyword, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{keyword}</span>
                        <Badge variant="outline" className="text-xs">Long-tail</Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-3">Question Keywords</h4>
                  <div className="space-y-2">
                    {keywordData.suggestions.questions.map((question, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{question}</span>
                        <Badge variant="outline" className="text-xs">Question</Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-3">Semantic Keywords</h4>
                  <div className="flex flex-wrap gap-1">
                    {keywordData.suggestions.semantic.map((keyword, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}