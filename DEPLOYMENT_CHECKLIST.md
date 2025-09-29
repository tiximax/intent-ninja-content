# Deployment Checklist (Production/Staging)

This checklist helps you ship the app safely to production (or staging) with proper environment, build, and basic observability.

1) Prerequisites
- Node.js: v20+
- Supabase project available (URL + anon key)
- CI provider (GitHub Actions already configured) and hosting (e.g., Vercel/Netlify/Render…)

2) Configure environment variables (do NOT commit secrets)
- Copy .env.production.example values to your hosting/CI environment variables:
  - Required when going live (mock/bypass off):
    - VITE_SUPABASE_URL
    - VITE_SUPABASE_ANON_KEY
  - Recommended:
    - VITE_SENTRY_DSN (error tracking)
    - VITE_ENABLE_FETCH_LOGGER=true (breadcrumbs for key network calls)
    - VITE_LOG_ORIGINS=https://api.foo.com,https://bar.com (additional origins to log)
  - Typical production toggles:
    - VITE_USE_MOCK_CONTENT=false
    - VITE_BYPASS_AUTH=false
    - VITE_E2E_TEST_MODE=false

3) CI (GitHub Actions)
- Already set up at .github/workflows/unit-tests.yml:
  - Node versions: 20, 22
  - Lint + unit tests (indexer + env)
  - Generates output/content_index.json and uploads as artifact
  - Optional production env check: set GitHub repo secret REQUIRE_PROD_ENV=true and provide VITE_USE_MOCK_CONTENT, VITE_BYPASS_AUTH, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY in Secrets → CI will fail if config requires Supabase but is missing variables
- Recommended repo settings:
  - Branch protection: require the CI job "Unit & Utility Tests" to pass before merge

4) Build + Pre-deploy verification
- Local smoke test:
  - npm ci
  - npm run test:indexer && npm run test:env
  - npm run index:content:public
  - npm run build && npm run preview
  - Check http://localhost:4173 and /content-index
- Observability sanity:
  - If VITE_SENTRY_DSN set: verify no PII is captured (fetch logger masks tokens/emails/long hex)
  - Verify network breadcrumbs exist for whitelisted origins

5) Hosting setup
- Vercel/Netlify/Render:
  - Add environment variables from step 2 in hosting dashboard
  - Set build command: npm ci && npm run build
  - Set output directory: dist (default for Vite)
  - Optional prebuild: run content indexer in CI or a predeploy step (keeps public/content_index.json fresh)
- CDN cache:
  - Consider a short cache for /content_index.json or serve with cache-control: no-store if data updates frequently

6) Go-live checklist (5 minutes)
- [ ] ENV set (Supabase URL/Key present; mock/bypass disabled)
- [ ] Build succeeded and preview looks correct
- [ ] /content-index loads with real data (ensure index:content:public ran)
- [ ] Sentry events arrive (no PII)
- [ ] Core app flows (Dashboard, Keyword Research, SEO Tools) open without errors

7) Rollback plan
- If deployment misbehaves: revert to previous successful deployment in your hosting provider
- Keep CI artifacts (content_index.json) for quick comparison

8) Post-launch
- Monitor Sentry for new errors (5xx should be error level, 4xx warning)
- Adjust VITE_LOG_ORIGINS as new APIs are introduced
- Consider CI adding smoke E2E (Playwright) for critical flows in later iterations
