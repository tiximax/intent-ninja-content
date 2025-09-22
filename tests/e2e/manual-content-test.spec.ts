import { test, expect } from '@playwright/test';

test('Manual content generation test with browser', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:8080');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Look for content generation form or navigate to dashboard
  await page.waitForSelector('body', { timeout: 10000 });
  
  // Take a screenshot to see the current page
  await page.screenshot({ path: 'debug-homepage.png', fullPage: true });
  
  // Try to navigate to dashboard if we're on landing page
  const dashboardLink = page.locator('a[href*="dashboard"], button:has-text("Dashboard"), a:has-text("Get Started")');
  if (await dashboardLink.first().isVisible({ timeout: 2000 })) {
    await dashboardLink.first().click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'debug-dashboard.png', fullPage: true });
  }
  
  // Look for content generation form
  const titleInput = page.locator('input[placeholder*="title"], input[name="title"], textarea[placeholder*="title"]');
  if (await titleInput.first().isVisible({ timeout: 5000 })) {
    console.log('Found title input field');
    
    // Fill in the form
    await titleInput.first().fill('Test SEO Content về kẹo hồng sâm Achimmadang');
    
    // Look for keywords field
    const keywordsInput = page.locator('input[placeholder*="keyword"], input[name="keywords"], textarea[placeholder*="keyword"]');
    if (await keywordsInput.first().isVisible({ timeout: 2000 })) {
      await keywordsInput.first().fill('kẹo hồng sâm, Achimmadang, sức khỏe');
    }
    
    // Look for generate button
    const generateBtn = page.locator('button:has-text("Generate"), button:has-text("Tạo"), button[type="submit"]');
    if (await generateBtn.first().isVisible({ timeout: 2000 })) {
      console.log('Found generate button, clicking...');
      
      // Take screenshot before generation
      await page.screenshot({ path: 'debug-before-generate.png', fullPage: true });
      
      await generateBtn.first().click();
      
      // Wait for generation to complete
      console.log('Waiting for content generation...');
      await page.waitForTimeout(30000); // Wait 30 seconds for generation
      
      // Take screenshot after generation
      await page.screenshot({ path: 'debug-after-generate.png', fullPage: true });
      
      // Check if content was generated
      const contentArea = page.locator('div:has-text("content"), pre, textarea:has(text)').first();
      if (await contentArea.isVisible({ timeout: 5000 })) {
        const content = await contentArea.textContent();
        console.log('Generated content length:', content?.length || 0);
        console.log('Content preview:', content?.substring(0, 200) + '...');
      }
    }
  }
  
  // Final screenshot
  await page.screenshot({ path: 'debug-final.png', fullPage: true });
  
  // Just pass the test - we're mainly debugging
  expect(true).toBe(true);
});