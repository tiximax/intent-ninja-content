import { test, expect } from '@playwright/test';

// E2E: Voice search in Content Library via Web Speech API stub

test('library voice search fills query and filters results', async ({ page }) => {
  // Stub SpeechRecognition before page scripts run
  await page.addInitScript(() => {
    // @ts-ignore
    window.webkitSpeechRecognition = function thisCtor() {
      // @ts-ignore
      const self = this;
      self.lang = 'vi-VN';
      self.interimResults = false;
      self.maxAlternatives = 1;
      self.onresult = null;
      self.onerror = null;
      self.onend = null;
      self.start = function start() {
        setTimeout(() => {
          const event = {
            results: [ [ { transcript: 'iPhone', confidence: 0.96 } ] ],
            resultIndex: 0
          } as any;
          if (typeof self.onresult === 'function') self.onresult(event);
          if (typeof self.onend === 'function') self.onend();
        }, 100);
      };
      self.stop = function stop() {};
    } as any;
  });

  // Ensure we have two items like previous tests
  await page.goto('/settings');
  await page.getByRole('tab', { name: 'Dự án' }).click();
  const exists = await page.getByText('Đang sử dụng').isVisible().catch(() => false);
  if (!exists) {
    await page.getByRole('button', { name: 'Tạo dự án mới' }).click();
    await page.getByLabel('Tên dự án *').fill('Voice Project');
    await page.getByRole('button', { name: 'Tạo dự án' }).click();
    await expect(page.getByText('Đang sử dụng')).toBeVisible();
  }

  await page.goto('/dashboard');
  // Draft 1: Canon
  await page.evaluate(() => {
    const d = {
      title: 'Máy ảnh Canon chuyên nghiệp',
      keywords: 'máy ảnh, canon, nhiếp ảnh',
      language: 'vi',
      tone: 'professional',
      wordCount: 800,
      outline: [],
      brandVoicePreset: 'professional',
      brandCustomStyle: '',
      sectionDepth: 'standard',
      industryPreset: 'general',
    };
    localStorage.setItem('content-generator-draft', JSON.stringify(d));
    localStorage.setItem('bypassAuth', 'true');
  });
  await page.getByRole('button', { name: /Tạo Nội Dung SEO|Đang tạo nội dung/i }).click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
  await page.getByRole('button', { name: /Lưu nội dung|Đang lưu/i }).click();
  await page.waitForFunction(() => { try { return (JSON.parse(localStorage.getItem('local-content')||'[]')||[]).length >= 1 } catch { return false } });

  // Draft 2: iPhone
  await page.getByRole('button', { name: 'Tạo mới' }).click();
  await page.evaluate(() => {
    const d = {
      title: 'Điện thoại iPhone tối ưu hiệu năng',
      keywords: 'iphone, điện thoại, ios',
      language: 'vi',
      tone: 'professional',
      wordCount: 800,
      outline: [],
      brandVoicePreset: 'professional',
      brandCustomStyle: '',
      sectionDepth: 'standard',
      industryPreset: 'general',
    };
    localStorage.setItem('content-generator-draft', JSON.stringify(d));
  });
  await page.getByRole('button', { name: /Tạo Nội Dung SEO|Đang tạo nội dung/i }).click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã tạo' }).first()).toBeVisible();
  await page.getByRole('button', { name: /Lưu nội dung|Đang lưu/i }).click();
  await page.waitForFunction(() => { try { return (JSON.parse(localStorage.getItem('local-content')||'[]')||[]).length >= 2 } catch { return false } });

  // Open Library and test voice search
  await page.getByRole('tab', { name: 'Thư viện' }).click();
  await expect(page.getByRole('heading', { name: 'Thư viện nội dung' })).toBeVisible();
  const input = page.getByTestId('library-search');
  const cards = page.locator('[data-testid="library-card"]');
  await expect(cards).toHaveCount(2);

  await page.getByTestId('library-voice-btn').click();

  // Expect query filled from stub and results filtered to iPhone
  await expect(input).toHaveValue('iPhone', { timeout: 5000 });
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('iPhone');
});
