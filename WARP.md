# WARP.md

Chính sách sử dụng MCP (mức dự án)
- Luôn sử dụng 3 MCP trong mọi giai đoạn phát triển: Human MCP, Context7 MCP, Chrome DevTools MCP.
- Kế thừa quy tắc toàn cục tại: C:\Users\Admin\WARP.md; file dự án này sẽ ghi đè khi có khác biệt.
- Bảo mật: không in/ghi secrets ra console/log; dùng biến môi trường (ví dụ: CONTEXT7_API_KEY). Không commit secrets.
- Thực thi an toàn: tránh lệnh tương tác/pager; với Git dùng --no-pager khi xem diff/log; không chạy mã không tin cậy.
- Chất lượng & ổn định: so sánh ≥3 hướng tiếp cận khi cần, thêm validation input, xử lý lỗi có kiểm soát, ưu tiên giải pháp idempotent.

Gợi ý sử dụng 3 MCP:
- Human MCP: lập kế hoạch, phân tích giải pháp và edge cases; automation demo UI khi cần; performance trace có kiểm soát.
- Context7 MCP: resolve-library-id trước khi get-library-docs; tập trung chủ đề (topic) đúng phần API đang dùng để giảm sai sót.
- Chrome DevTools MCP: tạo trace ngắn, theo dõi CWV (LCP/INP/CLS), khoanh vùng nút thắt trước khi tối ưu.

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Dự án: Vite + React 18 + TypeScript (UI: shadcn-ui + Tailwind). Dữ liệu/auth qua Supabase. Kiểm thử end-to-end với Playwright. Node 20+ khuyến nghị (CI dùng Node 20).

1) Lệnh thường dùng (Windows PowerShell – pwsh)
- Cài đặt phụ thuộc
  - npm ci
  - npx playwright install  # cài browsers cho Playwright
- Chạy dev server (http://localhost:8080)
  - npm run dev
- Build và preview
  - npm run build
  - npm run preview
- Lint
  - npm run lint
  - (tùy chọn) npx eslint . --fix
- Test E2E (Playwright)
  - Toàn bộ: npm run test:e2e
    - Playwright sẽ tự khởi chạy dev server với các biến môi trường thuận tiện kiểm thử: VITE_USE_MOCK_CONTENT=true, VITE_BYPASS_AUTH=true, VITE_E2E_TEST_MODE=true (định nghĩa trong playwright.config.ts)
  - Chạy 1 spec: npm run test:e2e -- tests/e2e/smoke.spec.ts
  - Lọc theo tên test: npx playwright test -g "dashboard loads under bypass auth"
  - Mở trình duyệt (headed): npx playwright test --headed --ui
  - Live integration tests (gọi Supabase Edge Functions trực tiếp)
    - Generate Content (OpenAI):
      - $env:RUN_LIVE_GEN="true"
      - $env:VITE_SUPABASE_URL="{{VITE_SUPABASE_URL}}"
      - $env:VITE_SUPABASE_ANON_KEY="{{VITE_SUPABASE_ANON_KEY}}"
      - npm run test:e2e -- tests/e2e/generate-content-live.spec.ts
    - Generate Content (Gemini):
      - $env:RUN_LIVE_GEMINI="true"
      - $env:VITE_SUPABASE_URL="{{VITE_SUPABASE_URL}}"
      - $env:VITE_SUPABASE_ANON_KEY="{{VITE_SUPABASE_ANON_KEY}}"
      - npm run test:e2e -- tests/e2e/generate-content-gemini-live.spec.ts
    - SerpApi Keywords:
      - $env:RUN_LIVE_SERPAPI="true"
      - $env:VITE_SUPABASE_URL="{{VITE_SUPABASE_URL}}"
      - $env:VITE_SUPABASE_ANON_KEY="{{VITE_SUPABASE_ANON_KEY}}"
      - npm run test:e2e -- tests/e2e/serpapi-live.spec.ts
    - Lưu ý: thay {{...}} bằng giá trị thật từ môi trường an toàn; không in secrets ra logs.

2) Cấu hình môi trường
- Tạo file .env.local (không commit) dựa trên .env.example. Các biến chính:
  - VITE_SUPABASE_URL=
  - VITE_SUPABASE_ANON_KEY=
  - VITE_USE_MOCK_CONTENT=true  # cho phép fallback mock khi backend chưa sẵn sàng
  - (tùy chọn) VITE_ENABLE_SERPAPI_PROVIDER=false  # bật provider SerpApi khi cần
- Supabase client (src/integrations/supabase/client.ts) đọc import.meta.env và tự dùng giá trị placeholder an toàn nếu thiếu biến trong quá trình dev/test (tránh crash).
- E2E mặc định chạy với bypass auth và mock data do cấu hình trong playwright.config.ts.

3) Kiến trúc cấp cao
- Entry & Providers
  - src/main.tsx: mount <App /> vào #root
  - src/App.tsx: bọc QueryClientProvider (TanStack Query), ThemeProvider (next-themes), TooltipProvider, các Toaster; dùng React Router với lazy routes
- Routing
  - Public: "/" (Index), "/auth"
  - Protected qua <AuthGuard/>: "/dashboard", "/keyword-research", "/seo-tools", "/api-setup", "/settings"
  - Lazy load pages để tối ưu bundle; Suspense fallback hiển thị loading
- Layout & UI
  - DashboardLayout + AppSidebar là khung chính; UI xây bằng shadcn-ui (thư mục src/components/ui)
  - Tailwind cấu hình trong tailwind.config.ts; alias đường dẫn "@" -> ./src (vite.config.ts)
- Tầng tích hợp & domain logic
  - Supabase: src/integrations/supabase/client.ts tạo client từ VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY (hoặc placeholder khi thiếu)
  - Auth: src/hooks/useAuth.ts lắng nghe session Supabase; khi VITE_BYPASS_AUTH=true (từ Playwright), sẽ giả lập user để test.
  - Content Generation: src/hooks/useContentGeneration.ts gọi supabase.functions.invoke('generate-content'); có fallback mock khi VITE_USE_MOCK_CONTENT=true hoặc khi lỗi backend. Kết quả gồm intentAnalysis + content + seoScore.
  - Keyword Research: src/hooks/useKeywordResearch.ts sử dụng strategy provider tại src/services/keywordsProvider.ts
    - Mặc định provider 'mock'
    - Nếu bật VITE_ENABLE_SERPAPI_PROVIDER hoặc có SERPAPI_API_KEY (lưu localStorage qua Settings), provider 'serpapi' sẽ gọi edge function 'serpapi-keywords' (fallback mock nếu lỗi)
  - Content Manager: src/hooks/useContentManager.ts thao tác bảng 'content' trên Supabase; với VITE_E2E_TEST_MODE=true sẽ dùng localStorage để test UI an toàn
- Testing
  - Playwright (playwright.config.ts): baseURL http://localhost:8080; webServer "npm run dev"; chromium project; trace on-first-retry; env test mode được thiết lập sẵn
  - Bộ spec chính trong tests/e2e/*.spec.ts (smoke, settings, keyword-research, seo-tools, content-save, v.v.) và các spec live gọi Edge Functions

4) CI liên quan
- .github/workflows/e2e.yml: Node 20, npm ci, npx playwright install --with-deps, chạy npm run test:e2e, upload artifacts (traces, screenshots, report). Biến môi trường Supabase và SERPAPI được lấy từ GitHub Secrets khi có.

5) Quy ước dự án (quan trọng cho Agent)
- Sau mỗi tính năng/flow, phải chạy bộ E2E (Playwright) và sửa lỗi cho đến khi pass mới tiếp tục.
- Tránh thay đổi lớn khi chưa được chấp thuận; nếu cần refactor/lột xác kiến trúc, hãy xin xác nhận trước.
- Ghi lại specification/plan/tasks/tiến trình vào agent.md (root repo) để lần sau có thể tiếp tục mạch công việc.
- Ưu tiên trả lời/ghi chú bằng tiếng Việt.
