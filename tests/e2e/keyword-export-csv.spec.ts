import { test, expect } from '@playwright/test';

// E2E: Export CSV cho Keyword list
// Cách xác minh download trong Playwright: dùng page.waitForEvent('download') và kiểm tra tên file + contents

test('export keywords to CSV after research', async ({ page, context }) => {
  await page.goto('/keyword-research');

  // Nhập seed keyword và chạy research (mock)
  await page.fill('#seed-keyword', 'seo tools');
  const research = page.getByRole('button', { name: /Research/i });
  await research.click();

  // Chờ dữ liệu render
  await page.waitForSelector('[data-testid="export-csv-btn"]', { state: 'visible' });

  // Bắt sự kiện download
  const [ download ] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('export-csv-btn').click(),
  ]);

  // Kiểm tra tên file
  const filename = download.suggestedFilename();
  expect(filename).toMatch(/keywords\.csv$/);

  // Đọc nội dung file
  const path = await download.path();
  // path có thể null trên trình duyệt không hỗ trợ; thay thế bằng stream
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream as any) chunks.push(Buffer.from(chunk));
  const content = Buffer.concat(chunks).toString('utf8');

  // Kiểm tra header CSV và ít nhất 1 dòng dữ liệu
  expect(content.split('\n')[0]).toContain('keyword,searchVolume,competition,competitionIndex,cpc,difficulty');
  expect(content.split('\n').length).toBeGreaterThan(1);
});