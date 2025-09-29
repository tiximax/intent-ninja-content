import * as Sentry from '@sentry/react';
import { getEnv } from '../config/env';

let initialized = false;

export function initSentry() {
  if (initialized) return;
  try {
    // Use validated env (falls back gracefully in dev)
    const { VITE_SENTRY_DSN: dsn, VITE_SENTRY_ENV } = getEnv();
    const isE2E = String(((import.meta as any).env?.VITE_E2E_TEST_MODE ?? '')).toLowerCase() === 'true';
    if (!dsn || isE2E) return;

    Sentry.init({
      dsn,
      environment: VITE_SENTRY_ENV || (import.meta as any).env?.MODE || 'development',
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

export function breadcrumb(category: string, message: string, data?: Record<string, unknown>, level: 'debug' | 'info' | 'warning' | 'error' = 'info') {
  try {
    Sentry.addBreadcrumb({ category, message, data, level });
  } catch {
    // noop
  }
}
