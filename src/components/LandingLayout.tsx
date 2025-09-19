import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export function LandingLayout({ children }: LandingLayoutProps) {
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation Header */}
      <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IN</span>
            </div>
            <span className="font-semibold text-lg hidden sm:block">Intent Ninja</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Trang chủ
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link to="/keyword-research" className="text-muted-foreground hover:text-foreground transition-colors">
                Keyword Research
              </Link>
              <Link to="/seo-tools" className="text-muted-foreground hover:text-foreground transition-colors">
                SEO Tools
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Auth buttons for desktop */}
          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated ? (
              <Button asChild variant="default">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link to="/auth">Đăng nhập</Link>
                </Button>
                <Button asChild variant="default">
                  <Link to="/auth">Đăng ký</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card/95 backdrop-blur-sm">
          <nav className="flex flex-col space-y-4 p-4">
<Link 
              to="/" 
              className="inline-flex items-center h-11 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Trang chủ
            </Link>
            {isAuthenticated ? (
              <>
<Link 
                  to="/dashboard" 
                  className="inline-flex items-center h-11 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
<Link 
                  to="/keyword-research" 
                  className="inline-flex items-center h-11 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Keyword Research
                </Link>
<Link 
                  to="/seo-tools" 
                  className="inline-flex items-center h-11 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  SEO Tools
                </Link>
              </>
            ) : (
              <div className="flex flex-col space-y-2 pt-2">
                <Button asChild variant="ghost" onClick={() => setMobileMenuOpen(false)}>
                  <Link to="/auth">Đăng nhập</Link>
                </Button>
                <Button asChild variant="default" onClick={() => setMobileMenuOpen(false)}>
                  <Link to="/auth">Đăng ký</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1 bg-gradient-subtle">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">IN</span>
                </div>
                <span className="font-semibold text-lg">Intent Ninja</span>
              </div>
              <p className="text-muted-foreground text-sm">
                AI-powered SEO content generation tool. 
                Phân tích search intent và tạo nội dung tối ưu tự động.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Tính năng</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Search Intent Analysis</li>
                <li>Content Generation</li>
                <li>Keyword Research</li>
                <li>SEO Optimization</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Hỗ trợ</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Hướng dẫn sử dụng</li>
                <li>API Documentation</li>
                <li>Liên hệ</li>
                <li>Báo lỗi</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 Intent Ninja. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link to="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}