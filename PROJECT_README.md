# Intent Ninja – Project README

Mục tiêu
- Ứng dụng AI giúp phân tích search intent và tạo nội dung SEO.
- Stack: Vite + React 18 + TypeScript, shadcn-ui + Tailwind, TanStack Query, React Router, Supabase (auth/db), Playwright (E2E).

Yêu cầu môi trường
- Node 20+
- Supabase project (URL + anon key)

Cài đặt & chạy
- Cài deps: npm ci
- Dev server: npm run dev (http://localhost:8080)
- Build/Preview: npm run build && npm run preview
- Lint: npm run lint

Biến môi trường (copy .env.example -> .env.local)
- VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- VITE_USE_MOCK_CONTENT=true (dev: cho phép fallback mock)
- VITE_ENABLE_SERPAPI_PROVIDER=false (prod: bật provider SerpApi nếu có Edge Function tương ứng)

Kiểm thử E2E (Playwright)
- Toàn bộ: npm run test:e2e (tự khởi chạy dev server với mock mode, bypass auth)
- 1 spec: npm run test:e2e -- tests/e2e/smoke.spec.ts
- Live tests (cần Supabase Functions + secrets): xem supabase/functions/README.md

Supabase
- Migrations tối thiểu: supabase/migrations/20250919_init.sql (projects, profiles, content, keywords + RLS)
- Edge Functions (skeleton + hướng dẫn): supabase/functions/README.md

Triển khai Production
- ENV: VITE_USE_MOCK_CONTENT=false, VITE_BYPASS_AUTH=false, VITE_E2E_TEST_MODE=false
- Bật SerpApi ở prod bằng ENV: VITE_ENABLE_SERPAPI_PROVIDER=true (localStorage sẽ bị bỏ qua ở production)
- Cấu hình OAuth redirect URL trong Supabase cho domain prod (nếu dùng Google)

Ghi chú
- README này bổ sung nội dung ngắn gọn cho dự án; WARP.md cung cấp hướng dẫn chi tiết cho Agent.
