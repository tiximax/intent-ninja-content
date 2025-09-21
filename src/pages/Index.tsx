import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LandingLayout } from "@/components/LandingLayout";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { 
  Brain, 
  Zap, 
  Target, 
  TrendingUp, 
  Globe,
  CheckCircle,
  ArrowRight,
  Sparkles,
  LogIn
} from "lucide-react";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const mockMode = String(((import.meta as any).env?.VITE_USE_MOCK_CONTENT ?? '')).toLowerCase() === 'true';

  // Warm up most likely next routes for faster navigation
  useEffect(() => {
    (async () => {
      try {
        if (isAuthenticated) {
          await import('./Dashboard');
        } else {
          await import('./Auth');
        }
        // Secondary routes
        import('./KeywordResearch');
        import('./SeoTools');
        import('./Settings');
      } catch {}
    })();
  }, [isAuthenticated]);

  return (
    <LandingLayout>
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center py-12 space-y-6">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered SEO Content Generation
            </Badge>
            {mockMode && (
              <Badge variant="outline">Mock Mode</Badge>
            )}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold gradient-text">
            Intent Ninja
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Tự động phân tích search intent và tạo nội dung SEO tối ưu bằng AI - không cần outline thủ công
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button asChild variant="hero" size="lg">
                <Link to="/dashboard">
                  <Brain className="w-5 h-5" />
                  Vào Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="hero" size="lg">
                <Link to="/auth">
                  <LogIn className="w-5 h-5" />
                  Đăng nhập
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
            
            <Button variant="outline" size="lg" className="border-2">
              <TrendingUp className="w-5 h-5" />
              Xem Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="shadow-soft hover:shadow-medium transition-all duration-300 group">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Intent Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Phân tích 5 loại search intent với độ chính xác cao
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-all duration-300 group">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Auto Generation</h3>
              <p className="text-sm text-muted-foreground">
                Tạo nội dung tối ưu trong vài giây với AI
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-all duration-300 group">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Keyword Optimization</h3>
              <p className="text-sm text-muted-foreground">
                Tích hợp Google Trends & Keyword Planner
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-all duration-300 group">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Multi-Language</h3>
              <p className="text-sm text-muted-foreground">
                Hỗ trợ Tiếng Việt & English với AI translation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">
              Tại sao chọn Intent Ninja?
            </h2>
            
            <div className="space-y-4">
              {[
                "Phân tích search intent tự động với AI",
                "Tích hợp miễn phí Google APIs",
                "Template động theo từng intent type",
                "Export đa format (HTML, MD, Word)",
                "Real-time SEO scoring & optimization",
                "Competitor gap analysis"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="shadow-soft hover:shadow-medium transition-all">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-4">Workflow Tự Động</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-white font-bold">1</div>
                  <div>
                    <h4 className="font-medium">Input Processing</h4>
                    <p className="text-sm text-muted-foreground">Nhập title → Keyword Planner extract keywords</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-white font-bold">2</div>
                  <div>
                    <h4 className="font-medium">Intent Detection</h4>
                    <p className="text-sm text-muted-foreground">AI analyze → Hiển thị 5 intents với confidence</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-white font-bold">3</div>
                  <div>
                    <h4 className="font-medium">Content Generation</h4>
                    <p className="text-sm text-muted-foreground">AI generate → SEO check → Preview/export</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="shadow-medium bg-gradient-hero text-white text-center p-8">
          <CardContent className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">
              Sẵn sàng tạo nội dung SEO chuyên nghiệp?
            </h2>
            <p className="text-white/90 max-w-2xl mx-auto">
              Tham gia cùng hàng ngàn content creator đang sử dụng Intent Ninja để tối ưu hóa SEO và tiết kiệm thời gian.
            </p>
            <Button asChild variant="outline" size="lg" className="bg-white text-primary hover:bg-white/90 border-0">
              <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                <Sparkles className="w-5 h-5" />
                {isAuthenticated ? "Vào Dashboard" : "Bắt Đầu Miễn Phí"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </LandingLayout>
  );
};

export default Index;
