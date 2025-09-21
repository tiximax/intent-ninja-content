import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initSentry } from './observability/sentry';

// Initialize Sentry (no-op if DSN missing or E2E test mode)
initSentry();

// Auto-recover from dynamic import/chunk load errors by reloading once
try {
  const handler = (e: PromiseRejectionEvent) => {
    const msg = String((e?.reason && (e as any).reason?.message) || e?.reason || '');
    if (/Failed to fetch dynamically imported module|ChunkLoadError|Loading chunk [\d]+ failed|Importing a module script failed/i.test(msg)) {
      console.warn('[Recovery] chunk/dynamic import failure detected. Reloading...');
      // Avoid infinite loops by removing listener before reload
      window.removeEventListener('unhandledrejection', handler as any);
      setTimeout(() => window.location.reload(), 50);
    }
  };
  window.addEventListener('unhandledrejection', handler as any);
} catch {}

// Runtime preconnect/dns-prefetch to Supabase (if configured)
try {
  const supa = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  if (supa) {
    const origin = new URL(supa).origin;
    const link1 = document.createElement('link');
    link1.rel = 'dns-prefetch';
    link1.href = origin;
    document.head.appendChild(link1);
    const link2 = document.createElement('link');
    link2.rel = 'preconnect';
    link2.href = origin;
    link2.crossOrigin = '';
    document.head.appendChild(link2);
  }
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
