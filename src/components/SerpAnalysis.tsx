import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  ExternalLink, 
  Globe, 
  Clock, 
  Eye, 
  TrendingUp,
  Star,
  Image,
  Video,
  FileText
} from "lucide-react";

interface SerpResult {
  position: number;
  title: string;
  url: string;
  description: string;
  domain: string;
  type: 'organic' | 'featured' | 'image' | 'video' | 'news';
  metrics: {
    titleLength: number;
    descriptionLength: number;
    hasStructuredData: boolean;
    loadSpeed: number;
    mobileOptimized: boolean;
  };
}

interface SerpFeatures {
  featuredSnippet: boolean;
  peopleAlsoAsk: boolean;
  relatedSearches: boolean;
  images: boolean;
  videos: boolean;
  news: boolean;
  shopping: boolean;
  localPack: boolean;
}

export function SerpAnalysis() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [serpData, setSerpData] = useState<{
    results: SerpResult[];
    features: SerpFeatures;
    totalResults: number;
    searchTime: number;
  } | null>(null);

  // Mock SERP data for demonstration
  const mockSerpData = {
    results: [
      {
        position: 1,
        title: "Complete SEO Guide 2024 - Best Practices & Tools",
        url: "https://example1.com/seo-guide-2024",
        description: "Learn the complete SEO strategy for 2024. This comprehensive guide covers keyword research, on-page optimization, technical SEO, and link building techniques.",
        domain: "example1.com",
        type: 'organic' as const,
        metrics: {
          titleLength: 48,
          descriptionLength: 158,
          hasStructuredData: true,
          loadSpeed: 2.1,
          mobileOptimized: true
        }
      },
      {
        position: 2,
        title: "SEO Best Practices for Beginners",
        url: "https://example2.com/seo-beginners",
        description: "Start your SEO journey with our beginner-friendly guide. Covers basics of search engine optimization including keyword research and content creation.",
        domain: "example2.com",
        type: 'organic' as const,
        metrics: {
          titleLength: 32,
          descriptionLength: 142,
          hasStructuredData: false,
          loadSpeed: 3.2,
          mobileOptimized: true
        }
      },
      {
        position: 3,
        title: "What is SEO? Search Engine Optimization Explained",
        url: "https://example3.com/what-is-seo",
        description: "SEO stands for Search Engine Optimization. It's the practice of increasing website visibility in search engine results pages through various techniques and strategies.",
        domain: "example3.com",
        type: 'featured' as const,
        metrics: {
          titleLength: 52,
          descriptionLength: 167,
          hasStructuredData: true,
          loadSpeed: 1.8,
          mobileOptimized: true
        }
      }
    ],
    features: {
      featuredSnippet: true,
      peopleAlsoAsk: true,
      relatedSearches: true,
      images: true,
      videos: false,
      news: false,
      shopping: false,
      localPack: false
    },
    totalResults: 247000000,
    searchTime: 0.41
  };

  const analyzeSERP = async () => {
    if (!searchQuery.trim()) return;
    
    setIsAnalyzing(true);
    // Simulate API call
    setTimeout(() => {
      setSerpData(mockSerpData);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getResultTypeIcon = (type: string) => {
    switch (type) {
      case 'featured': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'image': return <Image className="w-4 h-4 text-blue-500" />;
      case 'video': return <Video className="w-4 h-4 text-red-500" />;
      case 'news': return <FileText className="w-4 h-4 text-green-500" />;
      default: return <Globe className="w-4 h-4 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          SERP Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            placeholder="Nhập từ khóa để phân tích SERP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            onClick={analyzeSERP}
            disabled={isAnalyzing || !searchQuery.trim()}
          >
            {isAnalyzing ? "Đang phân tích..." : "Phân tích SERP"}
          </Button>
        </div>

        {serpData && (
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="results">Search Results</TabsTrigger>
              <TabsTrigger value="features">SERP Features</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span>Kết quả: ~{serpData.totalResults.toLocaleString()}</span>
                <span>Thời gian: {serpData.searchTime}s</span>
              </div>

              {serpData.results.map((result, index) => (
                <Card key={index} className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{result.position}
                        </Badge>
                        {getResultTypeIcon(result.type)}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div>
                          <h4 className="font-semibold text-blue-600 hover:underline cursor-pointer">
                            {result.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{result.domain}</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.description}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Title Length:</span>
                              <span className={result.metrics.titleLength <= 60 ? "text-green-600" : "text-red-600"}>
                                {result.metrics.titleLength}/60
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Description:</span>
                              <span className={result.metrics.descriptionLength <= 160 ? "text-green-600" : "text-red-600"}>
                                {result.metrics.descriptionLength}/160
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Load Speed:</span>
                              <span className={getScoreColor(result.metrics.loadSpeed <= 2 ? 100 : 50)}>
                                {result.metrics.loadSpeed}s
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Mobile Optimized:</span>
                              <span className={result.metrics.mobileOptimized ? "text-green-600" : "text-red-600"}>
                                {result.metrics.mobileOptimized ? "Yes" : "No"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {result.metrics.hasStructuredData && (
                          <Badge variant="secondary" className="text-xs">
                            Structured Data
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(serpData.features).map(([feature, isPresent]) => (
                  <Card key={feature} className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                      <Badge variant={isPresent ? "default" : "secondary"}>
                        {isPresent ? "Present" : "Absent"}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">SERP Features Impact</h4>
                  <div className="space-y-2 text-sm">
                    <p>• Featured Snippet: Có thể chiếm vị trí #0, tăng CTR đáng kể</p>
                    <p>• People Also Ask: Cơ hội mở rộng visibility với câu hỏi liên quan</p>
                    <p>• Related Searches: Gợi ý từ khóa bổ sung cho content strategy</p>
                    <p>• Images: Cơ hội hiển thị trong image pack nếu có hình ảnh chất lượng</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">📊 Competition Analysis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Avg Title Length:</span>
                        <span>44 characters</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Description Length:</span>
                        <span>156 characters</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sites with Structured Data:</span>
                        <span>67%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mobile Optimized:</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">🎯 Optimization Opportunities</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Target featured snippet với format FAQ</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Cải thiện title tags để nổi bật hơn</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Thêm structured data cho rich snippets</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Tối ưu hóa hình ảnh cho image pack</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">📈 Ranking Difficulty</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Overall Difficulty</span>
                          <span className="font-medium">72/100</span>
                        </div>
                        <Progress value={72} className="h-2" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        High competition keyword. Focus on long-tail variations and topic clusters for better ranking opportunities.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}