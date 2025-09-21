# Changelog

## v0.6.3 (2025-09-21)

Các thay đổi nổi bật:

- Edge Function: sửa prompt khi KHÔNG có outline → bắt buộc viết BÀI VIẾT ĐẦY ĐỦ (không phải dàn ý); yêu cầu h1/h2/h3 + đoạn văn <p>, tối thiểu ~90% wordCount, CTA & FAQ.
- Tests:
  - Thêm UI test no-outline (mock): tests/e2e/no-outline-full-article.spec.ts
  - Thêm live test no-outline (skip mặc định): tests/e2e/no-outline-full-article-live.spec.ts
  - Thêm SEO Meta & Schema test: tests/e2e/seo-meta-schema.spec.ts
- E2E tổng thể: 69 passed, 1 skipped (live); Mobile suite: 20/20 passed.
- Deploy: đã deploy generate-content Edge Function lên Supabase.
- CI: chuẩn bị workflows cho E2E PR/Push (mock) và Live (manual/nightly).

## v0.6.2 (2025-09-21)

Các thay đổi nổi bật:

- CI/Playwright
  - Thay action cũ microsoft/playwright-github-action bằng lệnh khuyến nghị mới: `npx playwright install --with-deps` trong e2e-live.yml và e2e-nightly.yml (khắc phục lỗi deprecated trên Ubuntu runners).
  - Live workflow “E2E Live (Manual)” chạy thành công suite orchestrator3000 (1 passed).

- Tài liệu
  - Bổ sung checklist soát payload Content Generator vào agent.md.

## v0.6.1 (2025-09-21)

Các thay đổi nổi bật:

- E2E ổn định (mock)
  - playwright.config.ts: bỏ qua các tệp `*.live.spec.ts` trong suite mặc định để tránh phụ thuộc mạng.
  - Thêm CI Nightly: `.github/workflows/e2e-nightly.yml` chạy E2E mock hằng ngày.
- Live workflow thủ công
  - `.github/workflows/e2e-live.yml`: cho phép chọn suite (orchestrator3000/generate-content/gemini/serpapi/all).
- Toast & Tests
  - Thêm data-testid ổn định cho enhanced-toast: `toast-{context}-{type}`; cập nhật E2E dùng getByTestId thay vì so text.
  - Cập nhật assertion lưu nội dung: dùng “Đã lưu thành công” cho thống nhất với hệ thống toast.
- Dashboard Quick Action
  - Bổ sung các trường vào payload: `brandVoicePreset`, `brandCustomStyle`, `sectionDepth` lấy từ draft localStorage.
- Tài liệu
  - agent.md: cập nhật hướng dẫn chạy live, Nightly, và checklist kiểm tra payload.

Kết quả kiểm thử:
- Full E2E (mock): 63 passed, 1 skipped.
- Mobile responsiveness: 20/20 passed.

## v0.6.0 (2025-09-19)

Các thay đổi nổi bật:

- Orchestrator tối thiểu số từ (frontend)
  - Thêm bộ đếm từ và ghép phần mở rộng: `countWordsFromHtml`, `mergeHtmlSections`
  - `useContentGeneration`: tự động mở rộng nội dung theo outline (Advanced / FAQ / Case Studies / Checklist) cho đến khi đạt `wordCount` hoặc hết số vòng (tối đa 8)
  - Trạng thái và điều khiển: `isExpanding`, `cancelExpansion()`; toast tiến trình (id: `expansion-progress`) hiển thị (i/8)
  - ContentGeneratorForm: thêm nút “Dừng mở rộng” khi đang expand

- Toast UX (T6.4)
  - Dedupe cảnh báo, chuẩn hóa thời lượng, icon theo ngữ cảnh
  - Hỗ trợ update theo id (loading → success/error); error toast có `important` (ARIA-friendly)
  - ValidationError + ARIA cho form (role=alert, aria-invalid, aria-describedby)

- Mobile/Responsive (T7.1/T7.2)
  - Tăng touch target trên Landing menu (h-11) và Sidebar mobile (size=lg)
  - Điều chỉnh grid stats: 1 → 2 (tablet) → 4 (desktop); giảm padding mobile

- Performance
  - Lazy-load `CompetitorAnalysis` và `ContentExporter` (Suspense + CardLoadingState)

- Kiểm thử
  - Thêm live UI test đạt tối thiểu 3000 từ: `tests/e2e/generate-3000-ui-live.spec.ts` (PASS ~2.5’)
  - Củng cố các spec: error-boundary, enhanced-error-messages, retry, mobile-responsiveness (tất cả PASS)

- Tài liệu
  - Cập nhật `agent.md` với changelog chi tiết và kết quả test
