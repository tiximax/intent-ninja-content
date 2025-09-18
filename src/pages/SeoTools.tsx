import { DashboardLayout } from "@/components/DashboardLayout";
import { CompetitorAnalysis } from "@/components/CompetitorAnalysis";
import { SerpAnalysis } from "@/components/SerpAnalysis";
import { ContentOptimization } from "@/components/ContentOptimization";
import { BacklinkAnalysis } from "@/components/BacklinkAnalysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Search, 
  FileText, 
  Link,
  Globe,
  TrendingUp,
  Eye,
  Zap
} from "lucide-react";

export default function SeoTools() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Essential SEO Tools</h1>
            <p className="text-muted-foreground">
              Comprehensive SEO analysis and optimization tools
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Pro Tools
            </Badge>
          </div>
        </div>

        {/* Tools Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-muted-foreground">Competitor Analysis</p>
                  <p className="text-xl font-bold">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Search className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-muted-foreground">SERP Analysis</p>
                  <p className="text-xl font-bold">Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-muted-foreground">Content Optimization</p>
                  <p className="text-xl font-bold">Live</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Link className="w-5 h-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-muted-foreground">Backlink Analysis</p>
                  <p className="text-xl font-bold">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tools Tabs */}
        <Tabs defaultValue="competitor" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="competitor" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Competitor Analysis
            </TabsTrigger>
            <TabsTrigger value="serp" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              SERP Analysis
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Content Optimization
            </TabsTrigger>
            <TabsTrigger value="backlinks" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Backlink Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="competitor" className="space-y-6">
            <CompetitorAnalysis />
          </TabsContent>

          <TabsContent value="serp" className="space-y-6">
            <SerpAnalysis />
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <ContentOptimization />
          </TabsContent>

          <TabsContent value="backlinks" className="space-y-6">
            <BacklinkAnalysis />
          </TabsContent>
        </Tabs>

        {/* Tool Tips */}
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-lg">🛠️ Tool Usage Tips</CardTitle>
            <CardDescription>
              Best practices for using these SEO analysis tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Competitor Analysis
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Analyze top 3-5 competitors for target keywords</li>
                  <li>• Focus on content gaps and opportunities</li>
                  <li>• Study their content structure and length</li>
                  <li>• Monitor their backlink acquisition strategies</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  SERP Analysis
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Check SERP features for optimization opportunities</li>
                  <li>• Analyze title and description patterns</li>
                  <li>• Identify featured snippet opportunities</li>
                  <li>• Study local pack and image optimization needs</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Content Optimization
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Maintain keyword density between 1-3%</li>
                  <li>• Use semantic keywords for topic authority</li>
                  <li>• Optimize for readability and user experience</li>
                  <li>• Include relevant internal and external links</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Backlink Analysis
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Monitor toxic backlinks and disavow if needed</li>
                  <li>• Diversify anchor text distribution</li>
                  <li>• Focus on high-authority domain acquisition</li>
                  <li>• Track competitor backlink opportunities</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}