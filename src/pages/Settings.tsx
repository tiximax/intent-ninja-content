import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Key, Globe, Search, Brain, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UserProfile from "@/components/UserProfile";
import ProjectManager from "@/components/ProjectManager";

interface ApiKeys {
  googleTrends: string;
  searchConsole: string;
  keywordPlanner: string;
  openai: string;
  gemini: string;
  serpapi?: string;
}

export default function Settings() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    googleTrends: "",
    searchConsole: "",
    keywordPlanner: "",
    openai: "",
    gemini: "",
    serpapi: ""
  });

  const handleInputChange = (key: keyof ApiKeys, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Save to localStorage for now
    localStorage.setItem('seo-intent-api-keys', JSON.stringify(apiKeys));
    // mirror SERPAPI_API_KEY for provider strategy
    if (apiKeys.serpapi) {
      localStorage.setItem('SERPAPI_API_KEY', apiKeys.serpapi);
    } else {
      localStorage.removeItem('SERPAPI_API_KEY');
    }
    toast({
      title: "Đã lưu cài đặt",
      description: "API keys đã được lưu thành công",
    });
  };

  const handleReset = () => {
    setApiKeys({
      googleTrends: "",
      searchConsole: "",
      keywordPlanner: "",
      openai: "",
      gemini: ""
    });
    localStorage.removeItem('seo-intent-api-keys');
    toast({
      title: "Đã reset cài đặt",
      description: "Tất cả API keys đã được xóa",
      variant: "destructive"
    });
  };

// Load from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('seo-intent-api-keys');
    if (saved) {
      try {
        setApiKeys(JSON.parse(saved));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Cài đặt</h1>
          <p className="text-muted-foreground">
            Quản lý profile, dự án và API keys
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="projects">Dự án</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <UserProfile />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectManager />
          </TabsContent>

          <TabsContent value="api" className="space-y-8">

        {/* Google APIs Section */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Google APIs
            </CardTitle>
            <CardDescription>
              Cấu hình API keys cho Google Trends, Search Console và Keyword Planner
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="google-trends" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Google Trends API Key
              </Label>
              <Input
                id="google-trends"
                type="password"
                placeholder="Nhập Google Trends API key..."
                value={apiKeys.googleTrends}
                onChange={(e) => handleInputChange('googleTrends', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Dùng để phân tích xu hướng tìm kiếm và từ khóa liên quan
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search-console" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Console API Key
              </Label>
              <Input
                id="search-console"
                type="password"
                placeholder="Nhập Search Console API key..."
                value={apiKeys.searchConsole}
                onChange={(e) => handleInputChange('searchConsole', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lấy dữ liệu query, CTR và impressions từ website đã verify
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyword-planner" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Keyword Planner API Key
              </Label>
              <Input
                id="keyword-planner"
                type="password"
                placeholder="Nhập Keyword Planner API key..."
                value={apiKeys.keywordPlanner}
                onChange={(e) => handleInputChange('keywordPlanner', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lấy search volume và keyword difficulty từ Google Ads
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* AI Services Section */}
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-accent" />
              AI Services
            </CardTitle>
            <CardDescription>
              Cấu hình API keys cho OpenAI và Google Gemini
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="serpapi" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                SerpApi API Key (tuỳ chọn)
              </Label>
              <Input
                id="serpapi"
                type="password"
                placeholder="Nhập SerpApi key..."
                value={apiKeys.serpapi}
                onChange={(e) => handleInputChange('serpapi', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Dùng để bật provider SerpApi cho Keyword Research nếu có key (mặc định dùng mock)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="openai" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                OpenAI API Key
              </Label>
              <Input
                id="openai"
                type="password"
                placeholder="Nhập OpenAI API key (sk-...)..."
                value={apiKeys.openai}
                onChange={(e) => handleInputChange('openai', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Dùng để phân tích intent và tạo nội dung SEO với GPT models
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gemini" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Google Gemini API Key
              </Label>
              <Input
                id="gemini"
                type="password"
                placeholder="Nhập Gemini API key..."
                value={apiKeys.gemini}
                onChange={(e) => handleInputChange('gemini', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Alternative AI service cho content generation và intent analysis
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={handleReset}>
            Reset tất cả
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            Lưu cài đặt
          </Button>
        </div>

        {/* Help Section */}
        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="text-lg">Hướng dẫn lấy API Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">Google APIs:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Truy cập <code className="bg-muted px-1 py-0.5 rounded">console.cloud.google.com</code></li>
                <li>Tạo project mới hoặc chọn project có sẵn</li>
                <li>Enable APIs: Trends, Search Console, Google Ads</li>
                <li>Tạo credentials và copy API key</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">OpenAI:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Đăng ký tại <code className="bg-muted px-1 py-0.5 rounded">platform.openai.com</code></li>
                <li>Vào API keys section</li>
                <li>Tạo new secret key</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Google Gemini:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Truy cập <code className="bg-muted px-1 py-0.5 rounded">makersuite.google.com</code></li>
                <li>Tạo API key cho Gemini Pro</li>
              </ul>
            </div>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}