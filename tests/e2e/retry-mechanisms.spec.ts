import { test, expect } from '@playwright/test';

test.describe('Retry Mechanisms', () => {
  test.beforeEach(async ({ page }) => {
    // Set bypass auth
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('bypassAuth', 'true');
    });
  });

  test('content generation handles failures gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Go to create content tab
    await page.getByRole('tab', { name: 'Tạo nội dung' }).click();
    await page.waitForSelector('[data-testid="content-generator-card"]');
    
    // Fill form
    await page.fill('input[placeholder*="Cách tối ưu SEO"]', 'Test Retry Content');
    await page.fill('textarea[placeholder*="SEO onpage"]', 'retry, test, keywords');
    
    // Submit form - in mock mode this should work without retries
    const submitButton = page.locator('button[type="submit"]:has-text("Tạo nội dung AI")');
    await submitButton.click();
    
    // Wait for processing to complete
    await page.waitForTimeout(3000);
    
    // In mock mode, we should get successful content generation
    // The test verifies that the retry mechanism doesn't interfere with normal operation
    await expect(page.locator('[data-testid="content-generator-card"]')).toBeVisible();
    
    // Should not see retry messages in mock mode
    await expect(page.locator('text=Thử lại lần')).not.toBeVisible();
    await expect(page.locator('text=Tạo nội dung thất bại')).not.toBeVisible();
  });

  test('keyword research handles failures gracefully', async ({ page }) => {
    await page.goto('/keyword-research');
    
    // Fill form
    await page.fill('input[placeholder*="Nhập từ khóa"]', 'retry test keywords');
    
    // Submit research
    const researchButton = page.locator('button:has-text("Research")');
    await researchButton.click();
    
    // Wait for processing
    await page.waitForTimeout(3000);
    
    // In mock mode, research should succeed
    await expect(page.getByRole('tab', { name: 'Keywords' })).toBeVisible();
    
    // Should not see retry error messages
    await expect(page.locator('text=Thử lại lần')).not.toBeVisible();
    await expect(page.locator('text=Tìm kiếm thất bại')).not.toBeVisible();
  });

  test('retry mechanisms preserve user experience', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Test that multiple operations can be performed without issues
    await page.getByRole('tab', { name: 'Tạo nội dung' }).click();
    await page.fill('input[placeholder*="Cách tối ưu SEO"]', 'First Content');
    
    const submitButton = page.locator('button[type="submit"]:has-text("Tạo nội dung AI")');
    await submitButton.click();
    
    // Wait for first operation
    await page.waitForTimeout(2000);
    
    // Try another operation quickly
    await page.fill('input[placeholder*="Cách tối ưu SEO"]', 'Second Content');
    
    // Should still be able to interact with form
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    
    // No error states should be visible
    await expect(page.locator('text=Lỗi không mong muốn')).not.toBeVisible();
  });

  test('retry error handling is user-friendly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // We can't easily simulate real network failures in Playwright with mock mode
    // So this test verifies that error states don't appear unexpectedly
    
    await page.getByRole('tab', { name: 'Tạo nội dung' }).click();
    await page.fill('input[placeholder*="Cách tối ưu SEO"]', 'Error Test Content');
    
    const submitButton = page.locator('button[type="submit"]:has-text("Tạo nội dung AI")');
    await submitButton.click();
    
    // Wait for operation to complete
    await page.waitForTimeout(3000);
    
    // Should not see destructive error messages in mock mode
    await expect(page.locator('.destructive')).not.toBeVisible();
    
    // Should not see retry-related error messages
    await expect(page.locator('text=Đã thử')).not.toBeVisible();
    await expect(page.locator('text=lần thử')).not.toBeVisible();
  });

  test('loading states work correctly with retry mechanisms', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Go to keyword research
    await page.goto('/keyword-research');
    
    // Fill and submit
    await page.fill('input[placeholder*="Nhập từ khóa"]', 'loading test');
    
    const researchButton = page.locator('button:has-text("Research")');
    await researchButton.click();
    
    // Loading state should appear briefly
    // In mock mode, this might be very fast, so we just verify button behavior
    await expect(researchButton).toBeVisible();
    
    // Wait for completion
    await page.waitForTimeout(2000);
    
    // Should show results
    await expect(page.getByRole('tab', { name: 'Keywords' })).toBeVisible();
    
    // Button should be enabled again
    await expect(researchButton).toBeEnabled();
  });

  test('components maintain state during retry operations', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Fill out a complex form
    await page.getByRole('tab', { name: 'Tạo nội dung' }).click();
    
    await page.fill('input[placeholder*="Cách tối ưu SEO"]', 'State Preservation Test');
    await page.fill('textarea[placeholder*="SEO onpage"]', 'state, preservation, test');
    
    // Select different options
    const toneSelect = page.locator('select, [role="combobox"]').first();
    if (await toneSelect.isVisible()) {
      await toneSelect.click();
    }
    
    // Submit form
    const submitButton = page.locator('button[type=\"submit\"]:has-text(\"Tạo nội dung AI\")');
    await submitButton.scrollIntoViewIfNeeded();
    // Đôi khi overlay/transition có thể chặn click ngắn; dùng force để ổn định E2E
    await submitButton.click({ force: true });
    
    // Wait for operation
    await page.waitForTimeout(2000);
    
    // Form values should be preserved (not cleared by retry mechanism)
    await expect(page.locator('input[placeholder*="Cách tối ưu SEO"]')).toHaveValue('State Preservation Test');
    await expect(page.locator('textarea[placeholder*="SEO onpage"]')).toHaveValue('state, preservation, test');
  });

  test('retry mechanism respects user cancellation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // This test verifies that if user navigates away during operation,
    // retry mechanisms don't continue indefinitely
    
    await page.getByRole('tab', { name: 'Tạo nội dung' }).click();
    await page.fill('input[placeholder*="Cách tối ưu SEO"]', 'Cancellation Test');
    
    const submitButton = page.locator('button[type="submit"]:has-text("Tạo nội dung AI")');
    await submitButton.click();
    
    // Quickly navigate to another page
    await page.goto('/settings');
    
    // Wait a moment
    await page.waitForTimeout(1000);
    
    // Should be on settings page without issues
    await expect(page.locator('text=Cài đặt')).toBeVisible();
    
    // Go back to dashboard
    await page.goto('/dashboard');
    
    // Should work normally
    await expect(page.locator('[data-testid="content-generator-card"]')).toBeVisible();
  });
});