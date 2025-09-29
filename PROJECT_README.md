# Intent Ninja – Project README

[![Unit & Utility Tests](https://github.com/tiximax/intent-ninja-content/actions/workflows/unit-tests.yml/badge.svg)](https://github.com/tiximax/intent-ninja-content/actions/workflows/unit-tests.yml)

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
- Tham khảo thêm: DEPLOYMENT_CHECKLIST.md và mẫu .env.production.example

### CI – Optional ENV check (Secrets)
- Để bật kiểm tra ENV production trong CI, vào GitHub Settings → Secrets and variables → Actions và thêm:
  - REQUIRE_PROD_ENV=true
  - VITE_USE_MOCK_CONTENT=false
  - VITE_BYPASS_AUTH=false
  - VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- Chi tiết xem DEPLOYMENT_CHECKLIST.md.

Ghi chú
- README này bổ sung nội dung ngắn gọn cho dự án; WARP.md cung cấp hướng dẫn chi tiết cho Agent.

---

## ENV Validation (Fail-fast)
Module `src/config/env.ts` xác thực các biến môi trường Vite (import.meta.env) và fail-fast ở production khi thiếu biến bắt buộc.

- Biến được hỗ trợ (tối thiểu):
  - `VITE_SUPABASE_URL` (URL) – yêu cầu ở production nếu tắt mock hoặc tắt bypass auth
  - `VITE_SUPABASE_ANON_KEY` (string) – yêu cầu ở production nếu tắt mock hoặc tắt bypass auth
  - `VITE_USE_MOCK_CONTENT` (bool; dev mặc định `true`)
  - `VITE_BYPASS_AUTH` (bool; dev mặc định `true`, prod nên `false`)
  - `VITE_ENABLE_SERPAPI_PROVIDER` (bool; mặc định `false`)
  - `VITE_E2E_TEST_MODE` (bool; mặc định `false`)
- `VITE_SENTRY_DSN` (URL; tùy chọn)
- `VITE_SENTRY_ENV` (string; tùy chọn)
- `VITE_LOG_ORIGINS` (string; tùy chọn, CSV các origin để cho phép logger ghi breadcrumbs fetch – ví dụ: `https://api.foo.com,https://bar.com`)
- `VITE_ENABLE_FETCH_LOGGER` (bool; mặc định `true`) – tắt/bật network fetch logger

- Tích hợp:
  - `src/main.tsx` gọi `loadEnv({ failFast: true })` sớm, trước khi init Sentry.
  - `src/observability/sentry.ts` đọc DSN từ env đã validate và tự động no-op nếu thiếu hoặc khi `VITE_E2E_TEST_MODE=true`.

- Hành vi:
  - Development: cảnh báo nhẹ nếu thiếu biến; cung cấp default an toàn.
  - Production: ném lỗi (fail-fast) nếu thiếu biến bắt buộc (Supabase khi tắt mock/bypass).

## Content Indexer
CLI quét nội dung trong repo và sinh JSON index dùng cho SEO/dev productivity. Không phụ thuộc backend, chạy tốt trên Windows.

### Cài đặt
Không cần cài thêm gì. Script đã được tích hợp vào npm scripts.

### Cách chạy
- Dry-run (không ghi file):
  ```bash
  npm run index:content -- --dry-run
  ```
- Ghi file thật (mặc định):
  ```bash
  npm run index:content
  ```
  - Mặc định quét: `public` và `src`
  - Mặc định xuất: `output/content_index.json`

### Flags hỗ trợ
- `--root <dir>`: thư mục gốc cần quét (có thể lặp lại). Mặc định: `public`, `src`
- `--out <file>`: đường dẫn file JSON đầu ra. Mặc định: `output/content_index.json`
- `--maxSizeMB <n>`: giới hạn kích thước tệp (MB). Mặc định: `5`
- `--includeExt <csv>`: danh sách extension cần index. Mặc định: `.md,.mdx,.html,.txt`
- `--exclude-dirs <csv>`: thư mục loại trừ. Mặc định: `node_modules,.git,dist,.vercel,test-results,output`
- `--exclude-globs <csv>`: pattern loại trừ dùng `*` đơn giản, so khớp theo `relPath` (ví dụ: `*skip.md`)
- `--quiet`: giảm log
- `--dry-run`: chỉ log, không ghi file

### Output JSON (schema rút gọn)
```json
[
  {
    "path": "C:/.../public/blog/seo.html",
    "relPath": "public/blog/seo.html",
    "ext": ".html",
    "sizeBytes": 8421,
    "mtimeMs": 1727575223000,
    "title": "SEO Basics",
    "slug": "public-blog-seo",
    "keywords": ["seo", "content"]
  }
]
```

### Front-matter hỗ trợ (.md/.mdx)
- Nếu file có YAML front-matter ở đầu:
  ```
  ---
  title: Bài viết A
  keywords:
   - seo
   - content
  ---
  ```
  - `title` sẽ được ưu tiên làm tiêu đề.
  - `keywords` (list) sẽ được dùng nếu hợp lệ; nếu không có, script sẽ suy diễn từ nội dung.

### Ghi chú ổn định & Edge cases
- Thời gian chạy: O(N) theo số file; đọc phần đầu file (stream/chunk) để trích title/keywords.
- Bỏ qua tệp > `--maxSizeMB` và phần mở rộng nhị phân phổ biến.
- Unicode/tiếng Việt: slugify loại dấu, thống nhất lowercase, thay khoảng trắng bằng `-`.
- Nếu không tìm thấy file hợp lệ: vẫn tạo JSON rỗng `[]` và exit code 0.
- Nếu thư mục root không tồn tại: exit code 2.
- Quyền truy cập bị từ chối ở một số tệp: log cảnh báo và tiếp tục.
