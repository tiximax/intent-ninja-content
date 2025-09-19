import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  timeout: 120_000,
  retries: 0,
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
    timeout: 180_000,
    env: {
      VITE_USE_MOCK_CONTENT: 'false',
      VITE_BYPASS_AUTH: 'true',
      VITE_E2E_TEST_MODE: 'true',
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
