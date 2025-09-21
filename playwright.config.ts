import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  testIgnore: /.*live\.spec\.ts$/,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    port: 8080,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      VITE_USE_MOCK_CONTENT: 'true',
      VITE_BYPASS_AUTH: 'true',
      VITE_E2E_TEST_MODE: 'true',
      VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'public-anon-placeholder',
      // Force Mock provider by default in E2E to make tests deterministic
      VITE_ENABLE_SERPAPI_PROVIDER: 'false',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
