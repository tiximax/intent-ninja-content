import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink, 
  Key, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Globe,
  Search,
  BarChart3
} from "lucide-react";
import { useState } from "react";

export function ApiSetupGuide() {
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Hướng Dẫn Lấy API Keys</h1>
        <p className="text-muted-foreground">
          Chi tiết từng bước để tích hợp các API cần thiết
        </p>
      </div>

      {/* Google Cloud Console Setup */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Google Cloud Console - Thiết Lập Chung
          </CardTitle>
          <CardDescription>
            Bước đầu tiên để lấy tất cả Google APIs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Bước 1: Tạo Google Cloud Project</h4>
                <Badge variant="outline">Bắt buộc</Badge>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Truy cập <a href="https://console.cloud.google.com" target="_blank" className="text-primary hover:underline">Google Cloud Console</a></li>
                <li>Đăng nhập với tài khoản Google</li>
                <li>Nhấp "Select a project" → "New Project"</li>
                <li>Đặt tên project (VD: "seo-tool-project")</li>
                <li>Nhấp "Create"</li>
              </ol>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Bước 2: Enable Billing</h4>
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">Cần thẻ tín dụng</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Google APIs cần billing account, nhưng có free tier
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Trong project, chọn "Billing" từ menu</li>
                <li>Nhấp "Link a billing account"</li>
                <li>Tạo billing account mới hoặc chọn existing</li>
                <li>Thêm thông tin thẻ tín dụng</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Trends API */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Google Trends API
          </CardTitle>
          <CardDescription>
            Dữ liệu xu hướng tìm kiếm
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-800 dark:text-blue-200">Lưu ý quan trọng</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Google Trends không có official API. Chúng ta sẽ dùng unofficial library hoặc web scraping.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Phương án 1: Google Trends API (Unofficial)</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Sử dụng thư viện <code className="bg-background px-2 py-1 rounded">google-trends-api</code></li>
                <li>Không cần API key</li>
                <li>Có giới hạn rate limiting</li>
                <li>Miễn phí hoàn toàn</li>
              </ol>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => copyToClipboard("npm install google-trends-api", "trends-install")}
              >
                <Copy className="w-4 h-4 mr-1" />
                {copiedStep === "trends-install" ? "Copied!" : "Copy install command"}
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Phương án 2: SerpApi Google Trends</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Đăng ký tại <a href="https://serpapi.com" target="_blank" className="text-primary hover:underline">SerpApi.com</a></li>
                <li>Nhận 100 searches miễn phí/tháng</li>
                <li>Copy API key từ dashboard</li>
                <li>Paste vào phần Settings của tool</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Keyword Planner */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-green-600" />
            Google Ads API (Keyword Planner)
          </CardTitle>
          <CardDescription>
            Dữ liệu search volume và CPC
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-green-800 dark:text-green-200">Yêu cầu</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              Cần có Google Ads account với spending history hoặc chạy ads
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Bước 1: Tạo Google Ads Account</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Truy cập <a href="https://ads.google.com" target="_blank" className="text-primary hover:underline">Google Ads</a></li>
                <li>Tạo account mới</li>
                <li>Setup campaign đầu tiên (có thể pause sau)</li>
                <li>Có spending history để access Keyword Planner</li>
              </ol>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Bước 2: Enable Google Ads API</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Trong Google Cloud Console, chọn project</li>
                <li>Vào "APIs & Services" → "Library"</li>
                <li>Tìm "Google Ads API"</li>
                <li>Nhấp "Enable"</li>
              </ol>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Bước 3: Tạo Credentials</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Vào "APIs & Services" → "Credentials"</li>
                <li>Nhấp "Create credentials" → "API key"</li>
                <li>Copy API key</li>
                <li>Nhấp "Restrict key" → chọn "Google Ads API"</li>
              </ol>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Bước 4: Lấy Developer Token</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Vào Google Ads account</li>
                <li>Chọn "Tools & Settings" → "API Center"</li>
                <li>Apply for developer token</li>
                <li>Đợi approval (có thể mất vài ngày)</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Solutions */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-600" />
            Giải Pháp Thay Thế
          </CardTitle>
          <CardDescription>
            Các API dễ tích hợp hơn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">SerpApi</h4>
              <ul className="text-sm space-y-1">
                <li>• Google Search results</li>
                <li>• Google Trends data</li>
                <li>• 100 free searches/month</li>
                <li>• Dễ setup</li>
              </ul>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <a href="https://serpapi.com" target="_blank">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Đăng ký SerpApi
                </a>
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">DataForSEO</h4>
              <ul className="text-sm space-y-1">
                <li>• Comprehensive SEO data</li>
                <li>• Keyword research</li>
                <li>• SERP analysis</li>
                <li>• Free trial available</li>
              </ul>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <a href="https://dataforseo.com" target="_blank">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Đăng ký DataForSEO
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start */}
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Bắt Đầu Nhanh
          </CardTitle>
          <CardDescription>
            Recommend để test ngay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h4 className="font-semibold mb-2">Phương án đơn giản nhất:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Đăng ký <strong>SerpApi</strong> (5 phút) → 100 free searches</li>
              <li>Copy API key vào tool Settings</li>
              <li>Test keyword research ngay</li>
              <li>Sau đó mới setup Google APIs phức tạp hơn</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}