import * as Sentry from '@sentry/react';

let initialized = false;

export function initSentry() {
  if (initialized) return;
  try {
    const dsn = (import.meta as any).env?.VITE_SENTRY_DSN as string | undefined;
    const isE2E = String(((import.meta as any).env?.VITE_E2E_TEST_MODE ?? '')).toLowerCase() === 'true';
    if (!dsn || isE2E) return;

    Sentry.init({
      dsn,
      environment: (import.meta as any).env?.VITE_SENTRY_ENV || (import.meta as any).env?.MODE || 'development',
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.0,
      replaysOnErrorSampleRate: 0.0,
    });
    initialized = true;
  } catch {
    // noop
  }
}

export function setSentryRequestId(reqId?: string) {
  try {
    if (!reqId) return;
    Sentry.setTag('requestId', reqId);
  } catch {
    // noop
  }
}