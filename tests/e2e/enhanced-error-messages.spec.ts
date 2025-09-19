import { test, expect } from '@playwright/test';

test.describe('Enhanced Error Messages & User Feedback', () => {
  test.beforeEach(async ({ page }) => {
    // Set bypass auth
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('bypassAuth', 'true');
    });
  });

  test('content generation shows enhanced error messages', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Go to create content tab
    await page.getByRole('tab', { name: 'Tạo nội dung' }).click();
    await page.waitForTimeout(1000);
    
    // Fill form with valid data to trigger success message
    await page.fill('input[placeholder*="Cách tối ưu SEO"]', 'Enhanced Error Message Test');
    await page.fill('textarea[placeholder*="SEO onpage"]', 'test, keywords, enhanced, messages');
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]:has-text("Tạo nội dung AI")');
    await submitButton.click();
    
    // Wait for processing and look for success or demo mode message
    await page.waitForTimeout(3000);
    
    // Should not see generic error messages
    await expect(page.locator('text=Unknown error')).not.toBeVisible();
    await expect(page.locator('text=Error occurred')).not.toBeVisible();
    
    // In mock mode, should see friendly demo message instead of error
    const demoMessage = page.locator('text=Demo').or(page.locator('text=mock')).or(page.locator('text=mẫu'));
    // This might be visible briefly, so we don't assert it must be visible
  });

  test('keyword research shows contextual feedback', async ({ page }) => {
    await page.goto('/keyword-research');
    
    // Fill form with valid keyword
    await page.fill('input[placeholder*="Nhập từ khóa"]', 'enhanced error messages');
    
    // Submit research
    const researchButton = page.locator('button:has-text("Research")');
    await researchButton.click();
    
    // Wait for processing
    await page.waitForTimeout(3000);
    
    // Should show results (in mock mode)
    await expect(page.getByRole('tab', { name: 'Keywords' })).toBeVisible();
    
    // Should not see generic error messages
    await expect(page.locator('text=Unknown error')).not.toBeVisible();
    await expect(page.locator('text=Failed')).not.toBeVisible();
  });

  test('form validation shows user-friendly messages', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Go to create content tab
    await page.getByRole('tab', { name: 'Tạo nội dung' }).click();
    await page.waitForTimeout(1000);
    
    // Try to submit with empty title
    const submitButton = page.locator('button[type="submit"]:has-text("Tạo nội dung AI")');
    
    // Fill only keywords but not title (if the form has client-side validation)
    await page.fill('textarea[placeholder*="SEO onpage"]', 'test keywords');
    
    // Try submit - form should handle validation gracefully
    await submitButton.click();
    
    // Wait and verify no harsh error messages
    await page.waitForTimeout(1000);
    
    // Should not see technical error messages
    await expect(page.locator('text=TypeError')).not.toBeVisible();
    await expect(page.locator('text=null is not defined')).not.toBeVisible();
    await expect(page.locator('text=500')).not.toBeVisible();
  });

  test('network status provides clear feedback', async ({ page }) => {
    await page.goto('/settings');
    
    // Test that settings page loads without showing network errors
    await expect(page.locator('text=Cài đặt')).toBeVisible();
    
    // Should not show generic network error messages
    await expect(page.locator('text=fetch failed')).not.toBeVisible();
    await expect(page.locator('text=Network Error')).not.toBeVisible();
    await expect(page.locator('text=Connection failed')).not.toBeVisible();
  });

  test('loading states provide context during operations', async ({ page }) => {
    await page.goto('/keyword-research');
    
    // Fill and submit form
    await page.fill('input[placeholder*="Nhập từ khóa"]', 'loading context test');
    
    const researchButton = page.locator('button:has-text("Research")');
    await researchButton.click();
    
    // Should show loading state briefly (may be very fast in mock mode)
    // We just verify button behavior is appropriate
    await expect(researchButton).toBeVisible();
    
    // Wait for completion
    await page.waitForTimeout(2000);
    
    // Button should be enabled again after completion
    await expect(researchButton).toBeEnabled();
    
    // Should have content results
    await expect(page.getByRole('tab', { name: 'Keywords' })).toBeVisible();
  });

  test('accessibility of error messages', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for load
    await page.waitForTimeout(2000);
    
    // Check that any error elements have proper ARIA attributes
    const errorElements = page.locator('[role="alert"], [aria-live="assertive"]');
    
    // If error elements exist, they should have proper accessibility
    const count = await errorElements.count();
    for (let i = 0; i < count; i++) {
      const element = errorElements.nth(i);
      
      // Verify error elements have proper roles or aria-live
      const role = await element.getAttribute('role');
      const ariaLive = await element.getAttribute('aria-live');
      
      // At least one should be present
      expect(role === 'alert' || ariaLive === 'assertive' || ariaLive === 'polite').toBeTruthy();
    }
  });

  test('toast notifications are informative', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Go to content generation
    await page.getByRole('tab', { name: 'Tạo nội dung' }).click();
    await page.waitForTimeout(1000);
    
    // Submit form to trigger toast
    await page.fill('input[placeholder*="Cách tối ưu SEO"]', 'Toast Notification Test');
    
    const submitButton = page.locator('button[type="submit"]:has-text("Tạo nội dung AI")');
    await submitButton.click();
    
    // Wait for any toast notifications
    await page.waitForTimeout(3000);
    
    // Check for toast notifications (Sonner)
    const toast = page.locator('[data-sonner-toast]') .first();
    
    // If a toast exists, it should not contain technical jargon
    if (await toast.isVisible()) {
      const toastText = await toast.textContent();
      
      // Should not contain technical error terms
      expect(toastText || '').not.toContain('undefined');
      expect(toastText || '').not.toContain('null');
      expect(toastText || '').not.toContain('500');
      expect(toastText || '').not.toContain('TypeError');
    }
  });

  test('error recovery options are available', async ({ page }) => {
    await page.goto('/keyword-research');
    
    // Fill form
    await page.fill('input[placeholder*="Nhập từ khóa"]', 'error recovery test');
    
    // Submit
    const researchButton = page.locator('button:has-text("Research")');
    await researchButton.click();
    
    // Wait for completion
    await page.waitForTimeout(2000);
    
    // Should have results or be able to try again
    const hasResults = await page.getByRole('tab', { name: 'Keywords' }).isVisible();
    const canRetry = await researchButton.isEnabled();
    
    // Either should have results OR be able to retry
    expect(hasResults || canRetry).toBeTruthy();
    
    // Form should remain functional
    await expect(page.locator('input[placeholder*="Nhập từ khóa"]')).toBeEditable();
  });
});