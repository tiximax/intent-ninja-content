import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import React, { Suspense } from 'react';
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
const Index = lazyWithRetry(() => import('./pages/Index'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const KeywordResearch = lazyWithRetry(() => import('./pages/KeywordResearch'));
const SeoTools = lazyWithRetry(() => import('./pages/SeoTools'));
const ApiSetup = lazyWithRetry(() => import('./pages/ApiSetup'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));
const Auth = lazyWithRetry(() => import('./pages/Auth'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
import AuthGuard from "./components/AuthGuard";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary onError={(error, errorInfo) => {
    console.error('App-level error:', error, errorInfo);
    // Here you could send to error tracking service like Sentry
  }}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div style={{ padding: 16 }}>Loading...</div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
                <Route path="/keyword-research" element={<AuthGuard><KeywordResearch /></AuthGuard>} />
                <Route path="/seo-tools" element={<AuthGuard><SeoTools /></AuthGuard>} />
                <Route path="/api-setup" element={<AuthGuard><ApiSetup /></AuthGuard>} />
                <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
