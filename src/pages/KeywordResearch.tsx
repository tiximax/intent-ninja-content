import { DashboardLayout } from "@/components/DashboardLayout";
import KeywordResearchPanel from "@/components/KeywordResearchPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  TrendingUp, 
  Target, 
  BarChart3,
  Globe,
  Settings,
  Download,
  Filter
} from "lucide-react";

export default function KeywordResearch() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Keyword Research</h1>
            <p className="text-muted-foreground">
              Phân tích từ khóa toàn diện với Google APIs
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Search className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-muted-foreground">Researched</p>
                  <p className="text-xl font-bold">2,847</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-muted-foreground">Trending</p>
                  <p className="text-xl font-bold">156</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Target className="w-5 h-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-muted-foreground">Low Comp</p>
                  <p className="text-xl font-bold">423</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-muted-foreground">Avg Volume</p>
                  <p className="text-xl font-bold">8.5K</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Status */}
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-lg">API Connections</CardTitle>
            <CardDescription>
              Current status of your Google APIs integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">Google Trends</span>
                </div>
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Placeholder
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-medium">Keyword Planner</span>
                </div>
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Placeholder
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium">Search Console</span>
                </div>
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Placeholder
                </Badge>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>API Notice:</strong> Currently using mock data. Add your Google API keys in Settings to access real keyword data.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Research Panel */}
        <KeywordResearchPanel />

        {/* Quick Actions */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Common keyword research workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <div className="flex items-center gap-2 w-full">
                  <Search className="w-4 h-4" />
                  <span className="font-medium">Competitor Analysis</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Analyze competitor keywords and gaps
                </p>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <div className="flex items-center gap-2 w-full">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">Seasonal Trends</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Identify seasonal keyword opportunities
                </p>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <div className="flex items-center gap-2 w-full">
                  <Target className="w-4 h-4" />
                  <span className="font-medium">Low Competition</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Find easy-to-rank keywords
                </p>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}