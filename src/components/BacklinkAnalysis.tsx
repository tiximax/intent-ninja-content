import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Link, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown,
  Shield,
  AlertTriangle,
  Globe,
  Calendar
} from "lucide-react";

interface BacklinkData {
  url: string;
  domain: string;
  domainAuthority: number;
  anchorText: string;
  linkType: 'dofollow' | 'nofollow';
  firstSeen: string;
  status: 'active' | 'lost' | 'broken';
  traffic: number;
}

interface BacklinkProfile {
  totalBacklinks: number;
  referringDomains: number;
  domainAuthority: number;
  toxicScore: number;
  newLinks: BacklinkData[];
  lostLinks: BacklinkData[];
  topLinks: BacklinkData[];
  anchorTextDistribution: {
    text: string;
    count: number;
    percentage: number;
  }[];
}

export function BacklinkAnalysis() {
  const [targetUrl, setTargetUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [backlinkData, setBacklinkData] = useState<BacklinkProfile | null>(null);

  // Mock backlink data
  const mockBacklinkData: BacklinkProfile = {
    totalBacklinks: 1847,
    referringDomains: 342,
    domainAuthority: 67,
    toxicScore: 12,
    newLinks: [
      {
        url: "https://techblog.example.com/seo-trends-2024",
        domain: "techblog.example.com",
        domainAuthority: 73,
        anchorText: "SEO best practices",
        linkType: 'dofollow',
        firstSeen: "2024-01-15",
        status: 'active',
        traffic: 2500
      },
      {
        url: "https://marketing.example.net/digital-strategy",
        domain: "marketing.example.net", 
        domainAuthority: 68,
        anchorText: "comprehensive SEO guide",
        linkType: 'dofollow',
        firstSeen: "2024-01-12",
        status: 'active',
        traffic: 1800
      }
    ],
    lostLinks: [
      {
        url: "https://oldblog.example.org/removed-post",
        domain: "oldblog.example.org",
        domainAuthority: 45,
        anchorText: "SEO tips",
        linkType: 'dofollow',
        firstSeen: "2023-11-20",
        status: 'lost',
        traffic: 800
      }
    ],
    topLinks: [
      {
        url: "https://authority.example.com/seo-resources",
        domain: "authority.example.com",
        domainAuthority: 89,
        anchorText: "ultimate SEO guide",
        linkType: 'dofollow',
        firstSeen: "2023-08-15",
        status: 'active',
        traffic: 5200
      },
      {
        url: "https://industry.example.net/best-tools",
        domain: "industry.example.net",
        domainAuthority: 82,
        anchorText: "SEO optimization",
        linkType: 'dofollow',
        firstSeen: "2023-06-10",
        status: 'active',
        traffic: 4100
      }
    ],
    anchorTextDistribution: [
      { text: "SEO guide", count: 45, percentage: 12.3 },
      { text: "SEO optimization", count: 38, percentage: 10.4 },
      { text: "best practices", count: 32, percentage: 8.7 },
      { text: "comprehensive guide", count: 28, percentage: 7.6 },
      { text: "SEO tips", count: 24, percentage: 6.5 }
    ]
  };

  const analyzeBacklinks = async () => {
    if (!targetUrl.trim()) return;
    
    setIsAnalyzing(true);
    // Simulate API call
    setTimeout(() => {
      setBacklinkData(mockBacklinkData);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getDomainAuthorityColor = (da: number) => {
    if (da >= 70) return "text-green-600";
    if (da >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getToxicScoreColor = (score: number) => {
    if (score <= 20) return "text-green-600";
    if (score <= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Shield className="w-4 h-4 text-green-500" />;
      case 'lost': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'broken': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="w-5 h-5" />
          Backlink Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            placeholder="Nhập URL website để phân tích backlinks..."
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
          />
          <Button 
            onClick={analyzeBacklinks}
            disabled={isAnalyzing || !targetUrl.trim()}
          >
            {isAnalyzing ? "Đang phân tích..." : "Phân tích"}
          </Button>
        </div>

        {backlinkData && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50 dark:bg-blue-900/10">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {backlinkData.totalBacklinks.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Backlinks</p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-900/10">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {backlinkData.referringDomains}
                  </div>
                  <p className="text-sm text-muted-foreground">Referring Domains</p>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 dark:bg-purple-900/10">
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${getDomainAuthorityColor(backlinkData.domainAuthority)}`}>
                    {backlinkData.domainAuthority}
                  </div>
                  <p className="text-sm text-muted-foreground">Domain Authority</p>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 dark:bg-orange-900/10">
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${getToxicScoreColor(backlinkData.toxicScore)}`}>
                    {backlinkData.toxicScore}%
                  </div>
                  <p className="text-sm text-muted-foreground">Toxic Score</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="new-links">New Links</TabsTrigger>
                <TabsTrigger value="top-links">Top Links</TabsTrigger>
                <TabsTrigger value="anchors">Anchor Text</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <h4 className="font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        New Links ({backlinkData.newLinks.length})
                      </h4>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {backlinkData.newLinks.slice(0, 3).map((link, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="truncate flex-1">{link.domain}</span>
                            <Badge variant="outline" className="text-xs">
                              DA {link.domainAuthority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <h4 className="font-semibold flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        Lost Links ({backlinkData.lostLinks.length})
                      </h4>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {backlinkData.lostLinks.map((link, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="truncate flex-1">{link.domain}</span>
                            <Badge variant="destructive" className="text-xs">
                              Lost
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">📊 Link Profile Health</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Domain Authority</span>
                          <span className={getDomainAuthorityColor(backlinkData.domainAuthority)}>
                            {backlinkData.domainAuthority}/100
                          </span>
                        </div>
                        <Progress value={backlinkData.domainAuthority} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Toxic Score (Lower is better)</span>
                          <span className={getToxicScoreColor(backlinkData.toxicScore)}>
                            {backlinkData.toxicScore}%
                          </span>
                        </div>
                        <Progress value={backlinkData.toxicScore} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="new-links" className="space-y-4">
                {backlinkData.newLinks.map((link, index) => (
                  <Card key={index} className="shadow-soft">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4" />
                            <span className="font-medium text-sm">{link.domain}</span>
                            {getStatusIcon(link.status)}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2">
                            Anchor: "{link.anchorText}"
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(link.firstSeen).toLocaleDateString()}
                            </span>
                            <span>Traffic: {link.traffic.toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={link.linkType === 'dofollow' ? 'default' : 'secondary'}>
                            {link.linkType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            DA {link.domainAuthority}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="top-links" className="space-y-4">
                {backlinkData.topLinks.map((link, index) => (
                  <Card key={index} className="shadow-soft border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4" />
                            <span className="font-medium text-sm">{link.domain}</span>
                            {getStatusIcon(link.status)}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2">
                            Anchor: "{link.anchorText}"
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(link.firstSeen).toLocaleDateString()}
                            </span>
                            <span>Traffic: {link.traffic.toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="default" className="bg-green-600">
                            High Authority
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            DA {link.domainAuthority}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="anchors" className="space-y-4">
                <Card>
                  <CardHeader>
                    <h4 className="font-semibold">Anchor Text Distribution</h4>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {backlinkData.anchorTextDistribution.map((anchor, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{anchor.text}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{anchor.count}</span>
                              <Badge variant="outline" className="text-xs">
                                {anchor.percentage}%
                              </Badge>
                            </div>
                          </div>
                          <Progress value={anchor.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50 dark:bg-yellow-900/10">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      Anchor Text Analysis
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p>• Brand anchors: 25% (Good - natural distribution)</p>
                      <p>• Exact match: 15% (Caution - may be over-optimized)</p>
                      <p>• Partial match: 35% (Good - balanced approach)</p>
                      <p>• Generic anchors: 25% (Good - natural diversity)</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}