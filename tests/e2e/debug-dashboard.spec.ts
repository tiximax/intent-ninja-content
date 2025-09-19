import { test, expect } from '@playwright/test';

test.describe.skip('Debug Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Set bypass auth before navigation
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('bypassAuth', 'true');
    });
    // Reload to ensure auth state updates
    await page.reload();
  });

  test('debug dashboard content', async ({ page }) => {
    // Listen for console messages and errors
    page.on('console', msg => {
      console.log('CONSOLE:', msg.type(), msg.text());
    });
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });
    
    // Ensure bypassAuth is set before navigation
    await page.evaluate(() => {
      localStorage.setItem('bypassAuth', 'true');
    });
    
    await page.goto('/dashboard');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-dashboard.png' });
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get current URL
    const url = page.url();
    console.log('Current URL:', url);
    
    // Get page HTML content
    const content = await page.content();
    console.log('Page content length:', content.length);
    console.log('Page content (first 1000 chars):', content.substring(0, 1000));
    
    // Check if any elements exist
    const allElements = await page.locator('*').count();
    console.log('Total elements on page:', allElements);
    
    // Check specifically for dashboard elements
    const dashboardElements = await page.locator('h1, h2, h3').all();
    console.log('Headers found:', dashboardElements.length);
    for (const el of dashboardElements) {
      const text = await el.textContent();
      console.log('Header text:', text);
    }
    
    // Check for tabs
    const tabs = await page.locator('[role="tab"]').all();
    console.log('Tabs found:', tabs.length);
    for (const tab of tabs) {
      const text = await tab.textContent();
      console.log('Tab text:', text);
    }
    
    // Check if we're on auth page instead
    const authElements = await page.locator('text=Đăng nhập, text=Login, text=Sign in').count();
    console.log('Auth elements found:', authElements);
    
    // Wait longer to see if content loads later
    await page.waitForTimeout(5000);
    
    const contentAfterWait = await page.content();
    console.log('Content after wait (first 1000 chars):', contentAfterWait.substring(0, 1000));
  });
});