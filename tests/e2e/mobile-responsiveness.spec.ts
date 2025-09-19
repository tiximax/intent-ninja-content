import { test, expect } from '@playwright/test';

// Common mobile viewport sizes
const MOBILE_VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'Galaxy S21', width: 384, height: 854 },
  { name: 'Small Mobile', width: 320, height: 568 },
] as const;

const TABLET_VIEWPORTS = [
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 834, height: 1194 },
  { name: 'Galaxy Tab', width: 800, height: 1280 },
] as const;

const DESKTOP_VIEWPORT = { name: 'Desktop', width: 1200, height: 800 };

test.describe('Mobile Responsiveness Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('bypassAuth', 'true');
    });
  });

  // Test 1: Landing page responsiveness
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`landing page responsive on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');

      // Landing page should be visible
      await expect(page.locator('h1')).toBeVisible();
      
      // CTA buttons should be accessible
      const ctaButtons = page.locator('button, a[href*="auth"], a[href*="dashboard"]');
      const ctaCount = await ctaButtons.count();
      if (ctaCount > 0) {
        let hasVisibleCTA = false;
        for (let i = 0; i < Math.min(ctaCount, 10); i++) {
          const cta = ctaButtons.nth(i);
          if (await cta.isVisible()) {
            hasVisibleCTA = true;
            break;
          }
        }
        expect(hasVisibleCTA).toBeTruthy();
      }

      // No horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 50); // Allow small margin

      // Text should be readable (not too small)
      const mainText = page.locator('h1, h2, p').first();
      if (await mainText.isVisible()) {
        const fontSize = await mainText.evaluate(el => 
          window.getComputedStyle(el).fontSize
        );
        const fontSizeNum = parseInt(fontSize);
        expect(fontSizeNum).toBeGreaterThanOrEqual(14); // Minimum readable size
      }
    });
  }

  // Test 2: Dashboard layout on mobile
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`dashboard layout on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Stats cards should stack vertically on mobile
      const statsCards = page.locator('text=Content Generated').locator('..').locator('..');
      if (await statsCards.isVisible()) {
        const cardRect = await statsCards.boundingBox();
        expect(cardRect?.width).toBeLessThanOrEqual(viewport.width);
      }

      // Navigation should be accessible
      const navigation = page.locator('[role="navigation"], nav, .sidebar');
      // On mobile, nav might be collapsed or in hamburger menu
      // We just check it doesn't break the layout

      // Tabs should be scrollable/accessible
      const tabs = page.locator('[role=\"tablist\"], .tabs');
      const tabsCount = await tabs.count();
      if (tabsCount > 0) {
        const firstTabs = tabs.first();
        if (await firstTabs.isVisible()) {
          const tabsRect = await firstTabs.boundingBox();
          expect(tabsRect?.width).toBeLessThanOrEqual(viewport.width + 10);
        }
      }

      // No horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 50);
    });
  }

  // Test 3: Content generator form on mobile
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`content generator form on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Try to access content generation tab
      const createTab = page.getByRole('tab', { name: 'Tạo nội dung' });
      if (await createTab.isVisible()) {
        await createTab.click();
        await page.waitForTimeout(1000);

        // Form inputs should be full-width and touchable
        const titleInput = page.locator('input[placeholder*="SEO"]');
        if (await titleInput.isVisible()) {
          const inputRect = await titleInput.boundingBox();
          expect(inputRect?.height).toBeGreaterThanOrEqual(44); // iOS minimum touch target
          expect(inputRect?.width).toBeGreaterThanOrEqual(200); // Reasonable width
        }

        // Textarea should be usable
        const textarea = page.locator('textarea[placeholder*="SEO"]');
        if (await textarea.isVisible()) {
          const textareaRect = await textarea.boundingBox();
          expect(textareaRect?.height).toBeGreaterThanOrEqual(80); // Minimum usable height
        }

        // Submit button should be accessible
        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.isVisible()) {
          const buttonRect = await submitButton.boundingBox();
          expect(buttonRect?.height).toBeGreaterThanOrEqual(44); // Touch target size
        }
      }
    });
  }

  // Test 4: Keyword research on mobile
  test('keyword research mobile layout', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORTS[1]); // iPhone 12
    await page.goto('/keyword-research');

    // Form should be usable
    const keywordInput = page.locator('input[placeholder*="từ khóa"]');
    await expect(keywordInput).toBeVisible();
    
    const inputRect = await keywordInput.boundingBox();
    expect(inputRect?.height).toBeGreaterThanOrEqual(44);

    // Research button should be accessible
    const researchButton = page.locator('button:has-text("Research")');
    await expect(researchButton).toBeVisible();
    
    const buttonRect = await researchButton.boundingBox();
    expect(buttonRect?.height).toBeGreaterThanOrEqual(44);

    // Test form interaction
    await keywordInput.fill('mobile test keyword');
    await researchButton.click();
    
    // Wait for results
    await page.waitForTimeout(3000);

    // Results should be displayed properly
    const resultsTab = page.getByRole('tab', { name: 'Keywords' });
    if (await resultsTab.isVisible()) {
      await expect(resultsTab).toBeVisible();
    }
  });

  // Test 5: Settings page mobile layout
  test('settings page mobile accessibility', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORTS[0]); // iPhone SE (smallest)
    await page.goto('/settings');

    // Page should load without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 50);

    // Form elements should be touchable
    const formInputs = page.locator('input, textarea, select');
    const inputCount = await formInputs.count();
    
    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = formInputs.nth(i);
      if (await input.isVisible()) {
        const rect = await input.boundingBox();
        expect(rect?.height).toBeGreaterThanOrEqual(40); // Minimum touch size
      }
    }

    // Buttons should be accessible
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const text = (await button.textContent())?.trim() || '';
        if (text.length === 0) continue; // bỏ qua icon-only buttons
        const rect = await button.boundingBox();
        expect(rect?.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  // Test 6: Tablet layout (intermediate sizes)
  for (const viewport of TABLET_VIEWPORTS) {
    test(`tablet layout on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Tablet should have better space utilization than mobile
      // but still be touch-friendly

      // Stats cards might be in 2x2 grid instead of single column
      const statsSection = page.locator('text=Content Generated').locator('..').locator('..');
      if (await statsSection.isVisible()) {
        // Should be visible and well-spaced
        await expect(statsSection).toBeVisible();
      }

      // No horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 50);

      // Touch targets should still be appropriately sized
      const buttons = page.locator('button').first();
      if (await buttons.isVisible()) {
        const rect = await buttons.boundingBox();
        expect(rect?.height).toBeGreaterThanOrEqual(40);
      }
    });
  }

  // Test 7: Responsive breakpoints
  test('responsive breakpoints behavior', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    // Test transition from desktop to tablet to mobile
    const viewports = [DESKTOP_VIEWPORT, TABLET_VIEWPORTS[0], MOBILE_VIEWPORTS[1]];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500); // Allow CSS transitions

      // Page should remain functional at each breakpoint
      await expect(page.locator('body')).toBeVisible();
      
      // No horizontal scroll at any breakpoint
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 50);

      // Interactive elements should remain clickable
      const interactiveElements = page.locator('button, a, input').first();
      if (await interactiveElements.isVisible()) {
        await expect(interactiveElements).toBeEnabled();
      }
    }
  });

  // Test 8: Text readability across devices
  test('text readability on various screen sizes', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    const allViewports = [...MOBILE_VIEWPORTS, ...TABLET_VIEWPORTS, DESKTOP_VIEWPORT];

    for (const viewport of allViewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);

      // Check heading sizes
      const headings = page.locator('h1, h2, h3');
      const headingCount = await headings.count();

      for (let i = 0; i < Math.min(headingCount, 3); i++) {
        const heading = headings.nth(i);
        if (await heading.isVisible()) {
          const fontSize = await heading.evaluate(el => 
            parseInt(window.getComputedStyle(el).fontSize)
          );
          
          // Headings should be at least 18px on all sizes (h3 có thể =18)
          const minSize = 18;
          expect(fontSize).toBeGreaterThanOrEqual(minSize);
        }
      }

      // Check body text
      const bodyText = page.locator('p, div, span').first();
      if (await bodyText.isVisible()) {
        const fontSize = await bodyText.evaluate(el => 
          parseInt(window.getComputedStyle(el).fontSize)
        );
        
        // Body text should be at least 14px on mobile, 16px preferred
        expect(fontSize).toBeGreaterThanOrEqual(14);
      }
    }
  });

  // Test 9: Navigation usability on mobile
  test('navigation accessibility on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORTS[0]); // Smallest screen
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    // Check if there's a mobile menu or if navigation is accessible
    const navElements = page.locator('[role="navigation"], nav, .sidebar, .menu');
    
    // Navigation should exist in some form
    if (await navElements.count() > 0) {
      // At least one nav element should be accessible
      const accessibleNav = navElements.first();
      
      // Should not overflow horizontally
      if (await accessibleNav.isVisible()) {
        const navRect = await accessibleNav.boundingBox();
        expect(navRect?.width).toBeLessThanOrEqual(375 + 20);
      }
    }

    // Page links should be navigable
    const pageLinks = page.locator('a[href^="/"], button[role="tab"]');
    const linkCount = await pageLinks.count();

    if (linkCount > 0) {
      // Test first few navigation links
      for (let i = 0; i < Math.min(linkCount, 3); i++) {
        const link = pageLinks.nth(i);
        if (await link.isVisible()) {
          const rect = await link.boundingBox();
          expect(rect?.height).toBeGreaterThanOrEqual(32); // Touch-friendly (tối thiểu 32px; sẽ nâng lên 40+ trong T7)
        }
      }
    }
  });
});