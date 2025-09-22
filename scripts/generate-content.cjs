// scripts/generate-content.cjs
// Usage:
//   node scripts/generate-content.cjs --title "cách mua hàng từ indo về vn" --keywords "cách mua hàng từ indo về vn, mua hàng Indonesia về Việt Nam" --words 2000 --language vi --tone professional

const fs = require('fs');

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      out[key] = val;
    }
  }
  return out;
}

function sanitizeEnv(v) {
  return String(v || '').replace(/[{}]/g, '').trim();
}

function slugify(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'output';
}

(async () => {
  const args = parseArgs(process.argv);
  const title = args.title || 'cách mua hàng từ indo về vn';
  const language = args.language || 'vi';
  const tone = args.tone || 'professional';
  const wordCount = parseInt(args.words || '2000', 10);
  const keywords = (args.keywords || 'cách mua hàng từ indo về vn,mua hàng Indonesia về Việt Nam')
    .split(',').map(s => s.trim()).filter(Boolean);

  const rawUrl = process.env.VITE_SUPABASE_URL;
  const rawAnon = process.env.VITE_SUPABASE_ANON_KEY;
  const url = sanitizeEnv(rawUrl);
  const anon = sanitizeEnv(rawAnon);

  if (!url || !anon) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
    process.exit(2);
  }

  const endpoint = `${url.replace(/\/$/, '')}/functions/v1/generate-content`;

  const body = { title, keywords, language, tone, wordCount };

  const reqId = `cli-gen-${Date.now()}`;
  console.log('Calling:', endpoint);
  console.log('Title:', title);
  console.log('Keywords:', keywords.join(', '));
  console.log('Word target:', wordCount);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anon}`,
      'x-request-id': reqId,
    },
    body: JSON.stringify(body),
  });

  console.log('Status:', res.status, res.statusText);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed: ${res.status} ${res.statusText} => ${text}`);
  }
  const data = await res.json();

  const provider = String(data?.providerUsed || 'fallback');
  const meta = String(data?.content?.metaDescription || '');
  const html = String(data?.content?.content || '');
  const t = String(data?.content?.title || title);

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wc = text.split(/\s+/).filter(Boolean).length;

  console.log('Provider:', provider);
  console.log('Meta length:', meta.length);
  console.log('Word count:', wc);

  const slug = slugify(title);
  const outDir = 'output';
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(`${outDir}/${slug}.json`, JSON.stringify(data, null, 2), 'utf8');

  const htmlDoc = `<!doctype html>\n<html lang="${language}">\n<head>\n<meta charset="utf-8">\n<title>${t}</title>\n<meta name="description" content="${meta.replace(/"/g, '&quot;')}">\n</head>\n<body>\n${html}\n</body>\n</html>`;
  fs.writeFileSync(`${outDir}/${slug}.html`, htmlDoc, 'utf8');

  console.log('Saved to:', `${outDir}/${slug}.json`, 'and', `${outDir}/${slug}.html`);
})();
