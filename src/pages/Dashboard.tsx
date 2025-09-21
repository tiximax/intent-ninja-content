import React, { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/DashboardLayout";
import ContentGeneratorForm from "@/components/ContentGeneratorForm";
import KeywordResearchPanel from "@/components/KeywordResearchPanel";
import { IntentAnalysisCard } from "@/components/IntentAnalysisCard";
import { SeoScoreCard } from "@/components/SeoScoreCard";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
// Lazy-loaded heavy components
const ContentExporterLazy = lazyWithRetry(() => import("@/components/ContentExporter").then(m => ({ default: m.ContentExporter as any })));
// Lazy-loaded heavy components
const SeoMetaSchemaLazy = lazyWithRetry(() => import("@/components/SeoMetaSchema").then(m => ({ default: (m as any).default })));
const SeoScoreCardLazy = lazyWithRetry(() => import("@/components/SeoScoreCard").then(m => ({ default: m.SeoScoreCard as any })));
const ContentLibraryLazy = lazyWithRetry(() => import("@/components/ContentLibrary").then(m => ({ default: (m as any).default })));
const CompetitorAnalysisLazy = lazyWithRetry(() => import("@/components/CompetitorAnalysis").then(m => ({ default: m.CompetitorAnalysis as any })));
import { ContentPreview } from "@/components/ContentPreview";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useContentGeneration } from "@/hooks/useContentGeneration";
import { useContentManager } from "@/hooks/useContentManager";
import { useProjectManager } from "@/hooks/useProjectManager";
import { useAuth } from "@/hooks/useAuth";
import { DashboardErrorBoundary } from "@/components/ui/error-boundary";
import { ContentLoadingState, SaveLoadingState, CardLoadingState } from "@/components/ui/loading";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  FileText, 
  Copy, 
  Download, 
  Eye, 
  Edit2,
  Sparkles,
  Search,
  BarChart3,
  RefreshCw,
  Users
} from "lucide-react";

// Mock data for demonstration
const mockIntents = [
  {
    type: "informational" as const,
    confidence: 85,
    keywords: ["what is SEO", "SEO guide", "search optimization"],
    description: "Users seeking to learn about SEO concepts and best practices"
  },
  {
    type: "commercial" as const,
    confidence: 72,
    keywords: ["best SEO tools", "SEO software comparison"],
    description: "Users researching SEO tools and solutions before purchase"
  },
  {
    type: "transactional" as const,
    confidence: 65,
    keywords: ["buy SEO course", "SEO services"],
    description: "Users ready to purchase SEO-related products or services"
  },
  {
    type: "navigational" as const,
    confidence: 45,
    keywords: ["Google Search Console", "SEMrush login"],
    description: "Users looking for specific SEO platforms or tools"
  },
  {
    type: "local" as const,
    confidence: 32,
    keywords: ["SEO agency near me", "local SEO services"],
    description: "Users seeking local SEO services or providers"
  }
];

const mockContent = `# Comprehensive Guide to SEO Content Optimization

## Introduction

Search Engine Optimization (SEO) content is the foundation of digital marketing success. Understanding search intent and creating content that matches user expectations is crucial for ranking well in search results.

## Understanding Search Intent

Search intent refers to the reason behind a user's search query. There are five main types:

### 1. Informational Intent
Users seeking to learn or understand something. Examples include "what is SEO" or "how to optimize content."

### 2. Navigational Intent  
Users looking for a specific website or page. Examples include "Google Search Console" or "SEMrush login."

### 3. Commercial Intent
Users researching products or services before making a purchase. Examples include "best SEO tools" or "SEO software comparison."

### 4. Transactional Intent
Users ready to make a purchase or take action. Examples include "buy SEO course" or "hire SEO consultant."

### 5. Local Intent
Users seeking local businesses or services. Examples include "SEO agency near me" or "local SEO services."

## Content Optimization Strategies

To create effective SEO content:

1. **Keyword Research**: Identify relevant keywords with good search volume and manageable competition
2. **Intent Matching**: Align your content with the search intent of your target keywords
3. **Content Structure**: Use clear headings, bullet points, and logical flow
4. **Meta Optimization**: Craft compelling titles and descriptions
5. **Internal Linking**: Connect related content to improve site structure

## Conclusion

Effective SEO content optimization requires understanding your audience's search intent and creating valuable, well-structured content that meets their needs.`;

export default function Dashboard() {
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  
  const { generateContent, isGenerating, generatedContent, intentAnalysis } = useContentGeneration();
  const { currentProject, projects } = useProjectManager();
  const { user } = useAuth();
  const { saveContent, saving } = useContentManager();

  const handleFormSubmit = async (formData: any) => {
    if (!currentProject) {
      toast({
        title: "Tạo nháp không cần dự án",
        description: "Bạn có thể tạo nội dung nháp ngay bây giờ. Để Lưu, vui lòng chọn hoặc tạo dự án trong Settings.",
      });
    }

    try {
      // Đọc draft từ localStorage để lấy outline và các trường đang có trong form con
      let draft: any = {};
      try {
        const raw = localStorage.getItem('content-generator-draft');
        if (raw) draft = JSON.parse(raw);
      } catch {}

      await generateContent({
        title: formData.title || draft.title || "Nội dung SEO",
        keywords: formData.keywords || (draft.keywords ? String(draft.keywords).split(',').map((k: string)=>k.trim()).filter(Boolean) : []),
        language: formData.language || draft.language || "vi",
        tone: formData.tone || draft.tone || "professional",
        wordCount: formData.wordCount || draft.wordCount || 1000,
        outline: draft.outline && Array.isArray(draft.outline) && draft.outline.length ? draft.outline : undefined,
        strictOutline: (draft.outline && Array.isArray(draft.outline) && draft.outline.length) ? true : false,
        brandVoicePreset: formData.brandVoicePreset || draft.brandVoicePreset,
        brandCustomStyle: formData.brandCustomStyle || draft.brandCustomStyle,
        sectionDepth: (formData.sectionDepth || draft.sectionDepth) as any,
      });
      
      setShowResults(true);
    } catch (error) {
      console.error('Content generation failed:', error);
    }
  };

  const copyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent.content);
      toast({
        title: "Copied to clipboard!",
        description: "Content has been copied to your clipboard.",
      });
    }
  };

  const handleSaveContent = async () => {
    if (!generatedContent || !currentProject) return;

    try {
      await saveContent({
        projectId: currentProject.id,
        title: generatedContent.title,
        content: generatedContent.content,
        metaDescription: generatedContent.metaDescription,
        keywords: generatedContent.keywordDensity ? [generatedContent.keywordDensity] : [],
        seoScore: generatedContent.seoScore,
        status: 'draft'
      }, user?.id || '');
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  };

  return (
    <DashboardLayout>
      <DashboardErrorBoundary>
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          <Card className="shadow-soft hover:shadow-medium transition-all">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Content Generated</p>
                  <p className="text-2xl font-bold">1,234</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-all">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">856</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-all">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Keywords Analyzed</p>
                  <p className="text-2xl font-bold">15.2K</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-all">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Avg. SEO Score</p>
                  <p className="text-2xl font-bold">87%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="create" onMouseEnter={() => { import("@/components/ContentGeneratorForm"); }}>Tạo nội dung</TabsTrigger>
            <TabsTrigger value="library" onMouseEnter={() => { import("@/components/ContentLibrary"); }}>Thư viện</TabsTrigger>
            <TabsTrigger value="analytics" onMouseEnter={() => { import("@/components/CompetitorAnalysis"); }}>Phân tích</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {!showResults ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tạo nội dung nhanh</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ContentGeneratorForm />
                    
                    <Button 
                      onClick={() => handleFormSubmit({})} 
                      className="w-full" 
                      variant="hero"
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Brain className="w-4 h-4 mr-2 animate-spin" />
                          Đang tạo nội dung...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Tạo Nội Dung SEO
                        </>
                      )}
                    </Button>

                    {!currentProject && (
                      <p className="text-sm text-muted-foreground text-center">
                        Bạn vẫn có thể tạo bản nháp. Để lưu nội dung, hãy chọn dự án trong phần Settings.
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                {/* Quick Tools */}
                <Card>
                  <CardHeader>
                    <CardTitle>Công cụ hỗ trợ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="keywords" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="keywords" className="flex items-center gap-2">
                          <Search className="w-4 h-4" />
                          Keywords
                        </TabsTrigger>
                        <TabsTrigger value="intent" className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Intent
                        </TabsTrigger>
                        <TabsTrigger value="competitor" className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Competitor
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="keywords" className="mt-4">
                        <KeywordResearchPanel />
                      </TabsContent>

                      <TabsContent value="intent" className="space-y-4 mt-4">
                        <IntentAnalysisCard intents={mockIntents} />
                      </TabsContent>

<TabsContent value="competitor" className="mt-4">
                        <Suspense fallback={<CardLoadingState />}>
                          <CompetitorAnalysisLazy />
                        </Suspense>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                <RecentlyViewed />
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Nội dung đã tạo</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSaveContent} disabled={saving} className="flex items-center gap-2">
                      {saving ? <SaveLoadingState /> : 'Lưu nội dung'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowResults(false)}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tạo mới
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div style={{ contentVisibility: 'auto', containIntrinsicSize: '1200px' }}>
                    <ContentPreview
                      content={generatedContent?.content || ''}
                      title="Nội dung đã tạo"
                      keywords={generatedContent?.keywordDensity ? [generatedContent.keywordDensity] : []}
                      isEditable={true}
                      onContentChange={(content) => {
                        if (generatedContent) {
                          // Update generated content
                        }
                      }}
                    />
                  </div>
                  
                  <div className="space-y-6" style={{ contentVisibility: 'auto', containIntrinsicSize: '900px' }}>
                    <Suspense fallback={<CardLoadingState />}>
                      <SeoScoreCardLazy
                        content={generatedContent?.content || ''}
                        title="Phân tích SEO"
                        keywords={generatedContent?.keywordDensity ? [generatedContent.keywordDensity] : []}
                      />
                    </Suspense>

                    <Suspense fallback={<CardLoadingState />}>
                      <SeoMetaSchemaLazy
                        title={generatedContent?.title || ''}
                        metaDescription={generatedContent?.metaDescription || ''}
                        contentHtml={generatedContent?.content || ''}
                      />
                    </Suspense>
                    
<Suspense fallback={<CardLoadingState />}>
                      <ContentExporterLazy
                        content={generatedContent?.content || ''}
                        title={generatedContent?.title || 'Nội dung SEO'}
                        metaDescription={generatedContent?.metaDescription || ''}
                      />
                    </Suspense>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <ContentGeneratorForm />
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            <Suspense fallback={<CardLoadingState />}>
              <ContentLibraryLazy />
            </Suspense>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Phân tích hiệu suất</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tính năng phân tích chi tiết sẽ được cập nhật trong phiên bản tiếp theo.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </DashboardErrorBoundary>
    </DashboardLayout>
  );
}