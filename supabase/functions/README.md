# Supabase Edge Functions (skeleton)

Thư mục này mô tả 2 Edge Functions mà ứng dụng đang gọi:
- generate-content: sinh nội dung SEO (OpenAI / Gemini) + intent analysis + seoScore
- serpapi-keywords: proxy lấy dữ liệu keyword/trends qua SerpApi (hoặc fallback mock)

Chưa kèm mã nguồn để tránh thay đổi lớn. Dưới đây là hướng dẫn triển khai chuẩn:

1) Chuẩn bị Supabase CLI (local)
- Cài đặt: npm i -D supabase hoặc tải binary (đã có supabase.exe trong repo Windows)
- Đăng nhập và link project: supabase link --project-ref <PROJECT_REF>

2) Cấu hình secrets (server-side)
- Generate Content (OpenAI)
  supabase secrets set OPENAI_API_KEY=*** CONTENT_MODEL=openai:gpt-4o-mini
- Generate Content (Gemini)
  supabase secrets set GEMINI_API_KEY=*** CONTENT_MODEL=gemini:pro
- SerpApi
  supabase secrets set SERPAPI_API_KEY=***

3) Deploy functions
- supabase functions deploy generate-content --project-ref <PROJECT_REF>
- supabase functions deploy serpapi-keywords --project-ref <PROJECT_REF>

4) Cấu hình ENV cho Frontend (client)
- VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
- VITE_SUPABASE_ANON_KEY=<anon/publishable key>
- (Prod) VITE_USE_MOCK_CONTENT=false
- (Bật SerpApi ở prod) VITE_ENABLE_SERPAPI_PROVIDER=true

5) Kiểm thử live (PowerShell)
- Gemini: $env:RUN_LIVE_GEMINI="true"; set VITE_* env; npx playwright test tests/e2e/generate-content-gemini-live.spec.ts
- OpenAI: $env:RUN_LIVE_GEN="true"; set VITE_* env; npx playwright test tests/e2e/generate-content-live.spec.ts
- SerpApi: $env:RUN_LIVE_SERPAPI="true"; set VITE_* env; npx playwright test tests/e2e/serpapi-live.spec.ts

Ghi chú
- Với môi trường production, hạn chế chế độ mock/bypass test và đảm bảo CORS/Allowed Origins đúng domain.
