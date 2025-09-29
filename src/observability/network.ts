import { breadcrumb } from './sentry';
import { getEnv } from '../config/env';

function redactValue(key: string, value: string): string {
  const k = key.toLowerCase();
  if (
    k.includes('token') || k.includes('key') || k.includes('secret') ||
    k.includes('auth') || k.includes('password') || k.includes('signature') || k.includes('dsn')
  ) return '<redacted>';
  // emails, long hex-like tokens
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return '<redacted_email>';
  if (/^[a-f0-9]{16,}$/i.test(value)) return '<redacted_hex>';
  return value.length > 128 ? value.slice(0, 125) + '...' : value;
}

function sanitizeUrl(inputUrl: string): string {
  try {
    const u = new URL(inputUrl, window.location.href);
    const qs = new URLSearchParams(u.search);
    const next = new URL(u.origin + u.pathname);
    for (const [k, v] of qs.entries()) {
      next.searchParams.set(k, redactValue(k, v));
    }
    return next.toString();
  } catch {
    return inputUrl;
  }
}

export function setupFetchLogger() {
  try {
    const { VITE_E2E_TEST_MODE, VITE_SUPABASE_URL, VITE_LOG_ORIGINS, VITE_ENABLE_FETCH_LOGGER } = getEnv();
    if (VITE_E2E_TEST_MODE || VITE_ENABLE_FETCH_LOGGER === false) return; // disable in E2E or when toggled off

    const allowedOrigins = new Set<string>();
if (VITE_SUPABASE_URL) {
      try { allowedOrigins.add(new URL(VITE_SUPABASE_URL).origin); } catch { /* ignore invalid URL */ }
    }
    if (VITE_LOG_ORIGINS) {
      try {
        String(VITE_LOG_ORIGINS).split(',').map(s => s.trim()).filter(Boolean).forEach(url => {
          try { allowedOrigins.add(new URL(url).origin); } catch { /* ignore invalid URL */ }
        });
      } catch { /* ignore parsing of VITE_LOG_ORIGINS */ }
    }

    const origFetch = window.fetch.bind(window);
    // simple dedupe within 30s window
    const lastLog = new Map<string, number>();
    const TTL = 30_000; // 30s

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const started = performance.now();
      const url = typeof input === 'string' ? input : (input as any)?.url || String(input);
      const method = (init?.method || (typeof input !== 'string' && (input as Request)?.method) || 'GET').toUpperCase();
      let res: Response;
      try {
        res = await origFetch(input as any, init);
        return res;
      } finally {
        try {
          const duration = Math.round(performance.now() - started);
          const safeUrl = sanitizeUrl(url);
          const u = (() => { try { return new URL(safeUrl); } catch { return null; } })();
          const origin = u?.origin || '';
          if (allowedOrigins.size && !allowedOrigins.has(origin)) {
            // Only log whitelisted origins if any provided
          } else {
            const status = (res && 'status' in res) ? (res as any).status : 'n/a';
            const size = (res && res.headers?.get?.('content-length')) || 'n/a';
            const key = `${method}|${u?.origin || ''}${u?.pathname || ''}|${status}`;
            const now = Date.now();
            // prune occasionally
            if (lastLog.size > 256) {
              for (const [k, t] of lastLog) { if (now - t > TTL) lastLog.delete(k); }
            }
            const prev = lastLog.get(key) || 0;
            if (now - prev > TTL) {
              lastLog.set(key, now);
              const level = typeof status === 'number' && status >= 500 ? 'error' : (typeof status === 'number' && status >= 400 ? 'warning' : 'info');
              breadcrumb('network', 'fetch', {
                method,
                url: safeUrl,
                status,
                durationMs: duration,
                size,
              }, level as any);
            }
          }
        } catch {
          // no-op
        }
      }
    };
  } catch {
    // no-op
  }
}
