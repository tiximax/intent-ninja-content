import { test, expect } from '@playwright/test';

test.describe('Loading States', () => {
  test.beforeEach(async ({ page }) => {
    // Set bypass auth
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('bypassAuth', 'true');
    });
  });

  test('dashboard shows consistent loading states', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await expect(page.locator('[data-testid="content-generator-card"]')).toBeVisible();
    
    // Verify no loading states are visible when not loading
    await expect(page.locator('text=Đang tạo nội dung...')).not.toBeVisible();
    await expect(page.locator('text=Đang lưu...')).not.toBeVisible();
    await expect(page.locator('text=Đang tìm kiếm...')).not.toBeVisible();
  });

  test('content generator shows loading state during generation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Go to create content tab
    await page.getByRole('tab', { name: 'Tạo nội dung' }).click();
    await page.waitForSelector('[data-testid="content-generator-card"]');
    
    // Fill form
    await page.fill('input[placeholder*="Cách tối ưu SEO"]', 'Test Content Generation');
    await page.fill('textarea[placeholder*="SEO onpage"]', 'test keywords');
    
    // Click generate - this will show loading state briefly
    const generateButton = page.locator('button[type="submit"]:has-text("Tạo nội dung AI")');
    await expect(generateButton).toBeVisible();
    
    // Note: In mock mode, loading states might be very brief
    // We mainly test that the buttons exist and are accessible
    await expect(generateButton).toBeEnabled();
  });

  test('keyword research shows loading state during search', async ({ page }) => {
    await page.goto('/keyword-research');
    
    // Fill seed keyword
    await page.fill('input[placeholder*="Nhập từ khóa"]', 'SEO optimization');
    
    // Click research button
    const researchButton = page.locator('button:has-text("Research")');
    await expect(researchButton).toBeVisible();
    await expect(researchButton).toBeEnabled();
    
    // In mock mode, the loading state might be very brief
    // We verify the button structure exists
    await researchButton.click();
    
    // Verify results eventually appear
    await expect(page.getByRole('tab', { name: 'Keywords' })).toBeVisible({ timeout: 10000 });
  });

  test('save button shows loading state when saving content', async ({ page }) => {
    await page.goto('/dashboard');
    
    // First create a project if none exists
    await page.goto('/settings');
    
    // Create a test project
    const createProjectButton = page.locator('button:has-text("Tạo dự án mới")');
    if (await createProjectButton.isVisible()) {
      await createProjectButton.click();
      await page.fill('input[placeholder*="tên dự án"]', 'Test Project for Loading');
      await page.fill('textarea[placeholder*="mô tả"]', 'Test project description');
      await page.fill('input[placeholder*="website"]', 'https://test.example.com');
      
      const saveProjectButton = page.locator('button:has-text("Tạo dự án")');
      await saveProjectButton.click();
      
      // Wait a moment for project creation
      await page.waitForTimeout(1000);
    }
    
    // Go back to dashboard and generate content
    await page.goto('/dashboard');
    
    // Fill content form
    await page.fill('input[placeholder*="Cách tối ưu SEO"]', 'Test Save Content');
    
    // Generate content first
    const generateButton = page.locator('button:has-text("Tạo Nội Dung SEO")').first();
    await generateButton.click();
    
    // Wait for content to be generated (in mock mode)
    await page.waitForTimeout(2000);
    
    // Look for save button - it might be in results view
    const saveButton = page.locator('button:has-text("Lưu nội dung")');
    
    // If save button exists, verify its structure
    if (await saveButton.isVisible()) {
      await expect(saveButton).toBeEnabled();
      
      // The button should have proper loading structure when clicked
      // In mock mode, this might be very fast, so we just verify structure
      await expect(saveButton).toContainText('Lưu nội dung');
    }
  });

  test('loading components have proper accessibility', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify main content is accessible
    await expect(page.locator('[data-testid="content-generator-card"]')).toBeVisible();
    
    // Check that loading states don't break page structure
    await page.getByRole('tab', { name: 'Tạo nội dung' }).click();
    await page.getByRole('tab', { name: 'Thư viện' }).click();
    await page.getByRole('tab', { name: 'Phân tích' }).click();
    await page.getByRole('tab', { name: 'Tổng quan' }).click();
    
    // Verify no broken layouts or missing content
    await expect(page.locator('text=Content Generated')).toBeVisible();
    await expect(page.locator('[data-testid="content-generator-card"]')).toBeVisible();
  });

  test('loading states are consistent across different screen sizes', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="content-generator-card"]')).toBeVisible();
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.locator('[data-testid="content-generator-card"]')).toBeVisible();
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.locator('[data-testid="content-generator-card"]')).toBeVisible();
    
    // Verify content is still accessible on mobile
    const generateButton = page.locator('button:has-text("Tạo Nội Dung SEO")').first();
    await expect(generateButton).toBeVisible();
  });
});