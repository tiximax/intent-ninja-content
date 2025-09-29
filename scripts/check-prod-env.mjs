#!/usr/bin/env node
/**
 * Optional production env check.
 * Fails when REQUIRE_PROD_ENV=true and app is configured for production
 * (VITE_USE_MOCK_CONTENT=false or VITE_BYPASS_AUTH=false) but required
 * Supabase env vars are missing.
 */

const REQUIRE = String(process.env.REQUIRE_PROD_ENV || '').toLowerCase() === 'true';
if (!REQUIRE) {
  console.log('[check-prod-env] Skipped (REQUIRE_PROD_ENV not true)');
  process.exit(0);
}

function bool(val, def=false) {
  const s = String(val ?? '').trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return def;
}

const USE_MOCK = bool(process.env.VITE_USE_MOCK_CONTENT, false);
const BYPASS_AUTH = bool(process.env.VITE_BYPASS_AUTH, false);
const NEEDS_SUPABASE = (!USE_MOCK || !BYPASS_AUTH);

if (NEEDS_SUPABASE) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  const errs = [];
  if (!url) errs.push('VITE_SUPABASE_URL is required');
  if (!key) errs.push('VITE_SUPABASE_ANON_KEY is required');
  if (errs.length) {
    console.error('[check-prod-env] Missing required env for production:', errs.join('; '));
    process.exit(2);
  }
}

console.log('[check-prod-env] OK');
process.exit(0);
