# Changelog

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
