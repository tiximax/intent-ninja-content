import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

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
