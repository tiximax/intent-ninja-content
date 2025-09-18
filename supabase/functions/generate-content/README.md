# Generate Content Edge Function (OpenAI/Gemini)

## Mục tiêu
- Cung cấp API generate-content an toàn (server-side) gọi OpenAI hoặc Google Gemini để tạo nội dung SEO ở định dạng JSON chuẩn, có fallback khi thiếu key/AI lỗi.

## File và secrets
- Code: `supabase/functions/generate-content/index.ts`
- Secrets (đặt trong Supabase):
  - `OPENAI_API_KEY` (tùy chọn)
  - `GEMINI_API_KEY` (tùy chọn)
  - `CONTENT_MODEL` (tùy chọn), ví dụ:
    - `openai:gpt-4o-mini`
    - `gemini:pro`

Có thể đặt một hoặc cả hai API key; function sẽ thử OpenAI trước, nếu lỗi/thiếu sẽ thử Gemini, nếu vẫn lỗi hoặc không có key nào, function sẽ trả fallback mock.

## Triển khai
```
supabase functions deploy generate-content
supabase secrets set OPENAI_API_KEY=... GEMINI_API_KEY=... CONTENT_MODEL=openai:gpt-4o-mini
```

## Cách gọi từ client
- Đã tích hợp sẵn trong hook `src/hooks/useContentGeneration.ts`: client gọi `supabase.functions.invoke('generate-content', { body })`.
- Nếu bật `VITE_USE_MOCK_CONTENT=true`, hook sẽ dùng mock ngay lập tức.

## Fallback
- Khi AI không sẵn sàng hoặc JSON không parse được, function trả về JSON fallback để UI luôn hoạt động.
