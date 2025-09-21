/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

// Detect common dynamic import/chunk-load failures
const isChunkLoadError = (err: any): boolean => {
  const msg = String(err?.message || err);
  return /Failed to fetch dynamically imported module|ChunkLoadError|Loading chunk [\d]+ failed|Importing a module script failed/i.test(msg);
};

export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  options?: { retries?: number; baseDelayMs?: number }
) {
  const retries = Math.max(1, options?.retries ?? 3);
  const baseDelayMs = options?.baseDelayMs ?? 400;

  const attempt = async (remaining: number): Promise<{ default: T }> => {
    try {
      return await factory();
    } catch (err) {
      if (remaining <= 1 || !isChunkLoadError(err)) {
        throw err;
      }
      const attemptIndex = (retries - remaining);
      const delay = baseDelayMs * Math.pow(2, attemptIndex);
      await new Promise((r) => setTimeout(r, delay));
      return attempt(remaining - 1);
    }
  };

  return React.lazy(() => attempt(retries));
}