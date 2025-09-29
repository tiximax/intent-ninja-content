#!/usr/bin/env node
// Minimal tests for ENV loader (dev/prod behavior)
// No external test framework; use simple assertions.

import path from 'path';
import url from 'url';

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

async function testDevDefaults() {
  // Simulate dev env with minimal vars
  globalThis.__ENV_SHIM = { MODE: 'development' };
  const { loadEnv } = await import(url.pathToFileURL(path.resolve('src/config/env.js')).href);
  const env = loadEnv({ failFast: false });
  assert(env.MODE === 'development', 'MODE should be development');
  assert(env.VITE_USE_MOCK_CONTENT === true, 'Dev default VITE_USE_MOCK_CONTENT should be true');
  assert(env.VITE_BYPASS_AUTH === true, 'Dev default VITE_BYPASS_AUTH should be true');
  delete globalThis.__ENV_SHIM;
}

async function testProdFailFastMissingSupabase() {
  globalThis.__ENV_SHIM = {
    MODE: 'production',
    VITE_USE_MOCK_CONTENT: 'false',
    VITE_BYPASS_AUTH: 'false',
  };
  const { loadEnv } = await import(url.pathToFileURL(path.resolve('src/config/env.js')).href);
  let threw = false;
  try {
    loadEnv({ failFast: true });
  } catch (e) {
    threw = true;
  }
  assert(threw, 'Should throw in production when Supabase vars missing and mock/bypass disabled');
  delete globalThis.__ENV_SHIM;
}

async function testProdOkWithSupabase() {
  globalThis.__ENV_SHIM = {
    MODE: 'production',
    VITE_USE_MOCK_CONTENT: 'false',
    VITE_BYPASS_AUTH: 'false',
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'anon_key_1234567890',
  };
  const { loadEnv } = await import(url.pathToFileURL(path.resolve('src/config/env.js')).href);
  const env = loadEnv({ failFast: true });
  assert(env.VITE_SUPABASE_URL.includes('https://'), 'VITE_SUPABASE_URL should be valid URL');
  assert(typeof env.VITE_SUPABASE_ANON_KEY === 'string' && env.VITE_SUPABASE_ANON_KEY.length > 0, 'Anon key should be present');
  delete globalThis.__ENV_SHIM;
}

(async () => {
  try {
    await testDevDefaults();
    await testProdFailFastMissingSupabase();
    await testProdOkWithSupabase();
    console.log('ENV loader tests passed');
    process.exit(0);
  } catch (e) {
    console.error('ENV loader tests failed:', e?.message || e);
    process.exit(1);
  }
})();
