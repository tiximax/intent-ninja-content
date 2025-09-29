import { z } from 'zod';

/**
 * Env loader & validator for Vite (client-side)
 * - Reads import.meta.env (replaced at build time)
 * - Coerces booleans from strings
 * - Provides sensible defaults in development
 * - Fails fast in production when required vars are missing
 */

const bool = (v: any, d = false): boolean => {
  const s = String(v ?? '').trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return d;
};

const EnvShape = z.object({
  MODE: z.string().default('development'),
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(10).optional(),
  VITE_USE_MOCK_CONTENT: z.boolean().default(true),
  VITE_ENABLE_SERPAPI_PROVIDER: z.boolean().default(false),
  VITE_E2E_TEST_MODE: z.boolean().default(false),
  VITE_BYPASS_AUTH: z.boolean().default(true),
  VITE_SENTRY_DSN: z.string().url().optional(),
  VITE_SENTRY_ENV: z.string().optional(),
  VITE_LOG_ORIGINS: z.string().optional(),
  VITE_ENABLE_FETCH_LOGGER: z.boolean().default(true),
});

export type AppEnv = z.infer<typeof EnvShape>;

export function loadEnv(options?: { failFast?: boolean; logger?: (level: 'warn' | 'error', msg: string) => void }): AppEnv {
  const log = options?.logger ?? ((level: 'warn' | 'error', msg: string) => {
    if (level === 'warn') console.warn(msg);
    else console.error(msg);
  });

  const raw = (import.meta as any).env || (globalThis as any).__ENV_SHIM || {};
  const mode = String(raw.MODE || 'development');

  const parsed = EnvShape.safeParse({
    MODE: mode,
    VITE_SUPABASE_URL: raw.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: raw.VITE_SUPABASE_ANON_KEY,
    VITE_USE_MOCK_CONTENT: bool(raw.VITE_USE_MOCK_CONTENT, mode !== 'production'),
    VITE_ENABLE_SERPAPI_PROVIDER: bool(raw.VITE_ENABLE_SERPAPI_PROVIDER, false),
    VITE_E2E_TEST_MODE: bool(raw.VITE_E2E_TEST_MODE, false),
    VITE_BYPASS_AUTH: bool(raw.VITE_BYPASS_AUTH, mode !== 'production'),
    VITE_SENTRY_DSN: raw.VITE_SENTRY_DSN,
    VITE_SENTRY_ENV: raw.VITE_SENTRY_ENV,
    VITE_LOG_ORIGINS: raw.VITE_LOG_ORIGINS,
    VITE_ENABLE_FETCH_LOGGER: bool(raw.VITE_ENABLE_FETCH_LOGGER, true),
  });

  if (!parsed.success) {
    const msg = parsed.error?.issues?.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') || 'ENV parse error';
    if (mode === 'production' || options?.failFast) {
      throw new Error(`ENV validation failed: ${msg}`);
    } else {
      log('warn', `[env] Non-fatal ENV issues in ${mode}: ${msg}`);
      // Best-effort fallback
      const data: any = {};
      for (const k of Object.keys(EnvShape.shape)) {
        (data as any)[k] = (raw as any)[k];
      }
      // Coerce booleans
      data.MODE = mode;
      data.VITE_USE_MOCK_CONTENT = bool(raw.VITE_USE_MOCK_CONTENT, mode !== 'production');
      data.VITE_ENABLE_SERPAPI_PROVIDER = bool(raw.VITE_ENABLE_SERPAPI_PROVIDER, false);
      data.VITE_E2E_TEST_MODE = bool(raw.VITE_E2E_TEST_MODE, false);
      data.VITE_BYPASS_AUTH = bool(raw.VITE_BYPASS_AUTH, mode !== 'production');
      return data as AppEnv;
    }
  }

  const env = parsed.data;

  // Conditional requirements for Supabase in production
  const needsSupabase = env.MODE === 'production' && (!env.VITE_USE_MOCK_CONTENT || !env.VITE_BYPASS_AUTH);
  if (needsSupabase) {
    if (!env.VITE_SUPABASE_URL) {
      const m = 'VITE_SUPABASE_URL is required in production when mock content is disabled or auth bypass is off.';
      if (options?.failFast || env.MODE === 'production') throw new Error(m);
      log('warn', `[env] ${m}`);
    }
    if (!env.VITE_SUPABASE_ANON_KEY) {
      const m = 'VITE_SUPABASE_ANON_KEY is required in production when mock content is disabled or auth bypass is off.';
      if (options?.failFast || env.MODE === 'production') throw new Error(m);
      log('warn', `[env] ${m}`);
    }
  }

  // Sentry: optional. If missing, init should no-op.

  return env;
}

// Convenience: singleton accessor
let cached: AppEnv | null = null;
export function getEnv(): AppEnv {
  if (!cached) cached = loadEnv({ failFast: false });
  return cached;
}