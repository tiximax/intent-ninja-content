#!/usr/bin/env node
/**
 * Content Indexer CLI (ESM, Node 20+)
 * - Quét nội dung trong các thư mục chỉ định và sinh JSON index (title, slug, size, mtime,...)
 * - Không thêm dependency bên thứ ba để giữ ổn định
 * - Hỗ trợ flags: --root, --out, --maxSizeMB, --includeExt, --exclude-dirs, --quiet, --dry-run
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Arg parsing ----------
function parseArgs(argv) {
  const args = {
    roots: [],
    out: 'output/content_index.json',
    maxSizeMB: 5,
    includeExt: ['.md', '.mdx', '.html', '.txt'],
    excludeDirs: ['node_modules', '.git', 'dist', '.vercel', 'test-results', 'output'],
    excludeGlobs: [],
    quiet: false,
    dryRun: false,
    help: false,
    copyPublic: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      args.help = true;
    } else if (a === '--root') {
      const v = argv[++i];
      if (!v) throw new Error('--root requires a value');
      args.roots.push(v);
    } else if (a === '--out') {
      const v = argv[++i];
      if (!v) throw new Error('--out requires a value');
      args.out = v;
    } else if (a === '--maxSizeMB') {
      const v = argv[++i];
      if (!v || isNaN(Number(v))) throw new Error('--maxSizeMB requires a number');
      args.maxSizeMB = Number(v);
    } else if (a === '--includeExt') {
      const v = argv[++i];
      if (!v) throw new Error('--includeExt requires a csv value');
      args.includeExt = v.split(',').map(s => s.trim()).filter(Boolean).map(n => n.startsWith('.') ? n : `.${n}`);
    } else if (a === '--exclude-dirs') {
      const v = argv[++i];
      if (!v) throw new Error('--exclude-dirs requires a csv value');
      args.excludeDirs = v.split(',').map(s => s.trim()).filter(Boolean);
    } else if (a === '--exclude-globs') {
      const v = argv[++i];
      if (!v) throw new Error('--exclude-globs requires a csv value');
      args.excludeGlobs = v.split(',').map(s => s.trim()).filter(Boolean);
    } else if (a === '--quiet') {
      args.quiet = true;
    } else if (a === '--dry-run') {
      args.dryRun = true;
    } else if (a === '--copy-public') {
      args.copyPublic = true;
    } else {
      // Unknown positional/flag
      throw new Error(`Unknown argument: ${a}`);
    }
  }

  if (args.roots.length === 0) {
    // Defaults if not provided
    args.roots = ['public', 'src'];
  }

  return args;
}

function printHelp() {
  const help = `\nContent Indexer CLI\nUsage:\n  node scripts/index-content.mjs [--root <dir> ...] [--out <file>] [--maxSizeMB <n>] [--includeExt <csv>] [--exclude-dirs <csv>] [--exclude-globs <csv>] [--quiet] [--dry-run] [--copy-public]\n\nOptions:\n  --root <dir>           Thư mục cần quét. Có thể lặp lại. Mặc định: public, src\n  --out <file>           File JSON đầu ra. Mặc định: output/content_index.json\n  --maxSizeMB <n>        Giới hạn kích thước tệp (MB). Mặc định: 5\n  --includeExt <csv>     Danh sách extension cần index. Mặc định: .md,.mdx,.html,.txt\n  --exclude-dirs <csv>   Danh sách thư mục loại trừ. Mặc định: node_modules,.git,dist,.vercel,test-results,output\n  --exclude-globs <csv>  Loại trừ theo pattern * đơn giản (so khớp theo relPath, ví dụ: *skip.md)
  --quiet                Giảm log\n  --dry-run              Chỉ log, không ghi file\n  --copy-public          Sau khi ghi out, sao chép sang public/content_index.json\n  -h, --help             Hiển thị trợ giúp\n`;
  console.log(help);
}

// ---------- Utils ----------
function logInfo(quiet, ...args) {
  if (!quiet) console.log(...args);
}
function logWarn(...args) { console.warn(...args); }
function logError(...args) { console.error(...args); }

function normalizeExt(name) {
  return path.extname(name || '').toLowerCase();
}

function removeDiacritics(str) {
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[đĐ]/g, m => (m === 'đ' ? 'd' : 'D'));
}

function toPosixPath(p) {
  return (p || '').replace(/\\/g, '/');
}

function wildcardToRegExp(pattern) {
  // Escape regex special chars, then replace * with .*
  const esc = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp('^' + esc + '$', 'i');
}

function slugify(relPath) {
  const noDiacritics = removeDiacritics(relPath);
  return noDiacritics
    .replace(/\\/g, '-')       // Windows backslashes → '-'
    .replace(/[\/]+/g, '-')     // slashes → '-'
    .replace(/[^a-zA-Z0-9\-_. ]+/g, '')
    .replace(/[\s_.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

const DEFAULT_STOPWORDS = new Set([
  // English
  'the','a','an','and','or','but','if','then','else','for','on','in','with','to','of','at','by','from','is','are','was','were','be','been','it','this','that','these','those','as','not','no','yes','you','we','they','i','he','she','them','us','our','your','their','will','can','may','might','should','would','could','do','does','did','done','have','has','had','about','into','over','under','between','within','without','while','when','where','how','what','which','who','whom','why',
  // Vietnamese (rút gọn)
  'và','hoặc','nhưng','nếu','thì','không','có','là','của','cho','từ','đến','trên','dưới','trong','ngoài','khi','đã','các','những','một','những','này','kia','đó','với','bằng','vì','do','được','đang','sẽ','rất','rằng','nên','hay'
]);

function extractKeywords(text, max = 10) {
  if (!text) return undefined;
  const lower = removeDiacritics(text.toLowerCase());
  const tokens = lower.split(/[^a-z0-9]+/g).filter(Boolean);
  const freq = new Map();
  for (const t of tokens) {
    if (DEFAULT_STOPWORDS.has(t)) continue;
    if (t.length <= 2) continue;
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  const arr = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]);
  const top = arr.slice(0, max).map(([w]) => w);
  return top.length >= 3 ? top : undefined;
}

async function safeStat(p) {
  try { return await fs.stat(p); } catch { return null; }
}

async function pathExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

function isBinaryExt(ext) {
  return [
    '.png','.jpg','.jpeg','.gif','.webp','.svg','.ico','.bmp',
    '.pdf','.exe','.zip','.tar','.gz','.tgz','.7z','.rar','.zst','.xz',
    '.woff','.woff2','.ttf','.eot',
    '.mp3','.wav','.flac','.mp4','.mkv','.mov','.avi','.webm',
  ].includes(ext);
}

async function readHead(p, maxBytes = 64 * 1024) {
  // Đọc phần đầu file để trích title/keywords (tránh load cả file lớn)
  const fh = await fs.open(p, 'r');
  try {
    const { size } = await fh.stat();
    const len = Math.min(size, maxBytes);
    const buf = Buffer.alloc(len);
    await fh.read(buf, 0, len, 0);
    return buf.toString('utf8');
  } finally {
    await fh.close();
  }
}

function parseFrontMatter(text) {
  // Minimal YAML front-matter parser: ---\n ... \n---\n at file start
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!fmMatch) return {};
  const yaml = fmMatch[1];
  const lines = yaml.split(/\r?\n/);
  let title;
  let description;
  let date; // YYYY-MM-DD
  const keywords = [];
  const tags = [];
  let inKeywordsBlock = false;
  let inTagsBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const t = ln.trim();
    if (/^title\s*:/i.test(t)) {
      const v = t.replace(/^title\s*:/i, '').trim().replace(/^['"]|['"]$/g, '');
      if (v) title = v;
      inKeywordsBlock = false;
      inTagsBlock = false;
      continue;
    }
    if (/^description\s*:/i.test(t)) {
      const v = t.replace(/^description\s*:/i, '').trim().replace(/^['"]|['"]$/g, '');
      if (v) description = v;
      inKeywordsBlock = false;
      inTagsBlock = false;
      continue;
    }
    if (/^date\s*:/i.test(t)) {
      const v = t.replace(/^date\s*:/i, '').trim().replace(/^['"]|['"]$/g, '');
      // basic YYYY-MM-DD validation
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) date = v;
      inKeywordsBlock = false;
      inTagsBlock = false;
      continue;
    }
    if (/^keywords\s*:/i.test(t)) {
      const after = t.replace(/^keywords\s*:/i, '').trim();
      inKeywordsBlock = true;
      inTagsBlock = false;
      if (after.startsWith('[') && after.endsWith(']')) {
        after.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean).forEach(k => keywords.push(k));
        inKeywordsBlock = false;
      }
      continue;
    }
    if (inKeywordsBlock) {
      const m = t.match(/^-\s*(.+)$/);
      if (m) {
        const k = m[1].trim().replace(/^['"]|['"]$/g, '');
        if (k) keywords.push(k);
        continue;
      } else if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*:/i.test(t)) {
        // next key starts
        inKeywordsBlock = false;
      }
    }
    if (/^tags\s*:/i.test(t)) {
      const after = t.replace(/^tags\s*:/i, '').trim();
      inTagsBlock = true;
      if (after.startsWith('[') && after.endsWith(']')) {
        after.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean).forEach(k => tags.push(k));
        inTagsBlock = false;
      }
      continue;
    }
    if (inTagsBlock) {
      const m2 = t.match(/^-\s*(.+)$/);
      if (m2) {
        const tg = m2[1].trim().replace(/^['"]|['"]$/g, '');
        if (tg) tags.push(tg);
        continue;
      } else if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*:/i.test(t)) {
        inTagsBlock = false;
      }
    }
  }
  return { title, description, date, keywords: keywords.length ? keywords : undefined, tags: tags.length ? tags : undefined };
}

function extractTitleFromMd(text) {
  const lines = text.split(/\r?\n/);
  for (const ln of lines) {
    const m = ln.match(/^#{1,6}\s+(.+?)\s*$/);
    if (m) return m[1].trim();
    // Lấy dòng đầu tiên không rỗng nếu không có heading
    if (ln.trim()) return ln.trim();
  }
  return undefined;
}

function extractTitleFromHtml(text) {
  const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();
  const h1Match = text.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) return h1Match[1].trim();
  // Thử meta og:title
  const ogMatch = text.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (ogMatch) return ogMatch[1].trim();
  return undefined;
}

function extractTitleFromTxt(text) {
  const lines = text.split(/\r?\n/);
  for (const ln of lines) {
    if (ln.trim()) return ln.trim();
  }
  return undefined;
}

// ---------- Core walk & index ----------
async function* walkDir(root, excludeDirsSet) {
  // Duyệt BFS để tránh quá sâu stack
  const queue = [root];
  while (queue.length) {
    const current = queue.shift();
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (e) {
      logWarn(`[skip] Cannot read dir: ${current} (${e.message})`);
      continue;
    }
    for (const ent of entries) {
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) {
        if (excludeDirsSet.has(ent.name)) {
          continue;
        }
        queue.push(full);
      } else if (ent.isFile()) {
        yield full;
      }
    }
  }
}

async function indexPaths({ roots, out, maxSizeMB, includeExt, excludeDirs, quiet, dryRun, copyPublic, excludeGlobs }) {
  const start = Date.now();
  const repoRoot = process.cwd();
  const includeSet = new Set(includeExt.map(e => e.toLowerCase()));
  const excludeDirsSet = new Set(excludeDirs);
  const excludeGlobRegexes = (excludeGlobs || []).map(p => wildcardToRegExp(toPosixPath(p)));
  const maxBytes = maxSizeMB * 1024 * 1024;

  const resolvedRoots = [];
  for (const r of roots) {
    const abs = path.isAbsolute(r) ? r : path.join(repoRoot, r);
    if (await pathExists(abs)) resolvedRoots.push(abs);
    else logWarn(`[warn] Root not found: ${r}`);
  }
  if (resolvedRoots.length === 0) {
    throw Object.assign(new Error('No valid roots to scan'), { code: 'NO_ROOTS' });
  }

  let scannedFiles = 0;
  let indexedFiles = 0;
  let skippedLarge = 0;
  let skippedExt = 0;
  let skippedBinary = 0;
  let skippedError = 0;

  const results = [];

  for (const root of resolvedRoots) {
    for await (const filePath of walkDir(root, excludeDirsSet)) {
      scannedFiles++;
      const relPath = path.relative(repoRoot, filePath);
      const relPathPosix = toPosixPath(relPath);
      const ext = normalizeExt(filePath);

      if (excludeGlobRegexes.length && excludeGlobRegexes.some(rx => rx.test(relPathPosix))) {
        // Skip by glob
        skippedExt++;
        continue;
      }

      if (!includeSet.has(ext)) {
        skippedExt++;
        continue;
      }
      if (isBinaryExt(ext)) {
        skippedBinary++;
        continue;
      }

      const st = await safeStat(filePath);
      if (!st || !st.isFile()) {
        skippedError++;
        continue;
      }
      if (st.size > maxBytes) {
        skippedLarge++;
        continue;
      }

      try {
        const head = await readHead(filePath);
        let title;
        let fmKw, fmDesc, fmTags, fmDate;
        if (ext === '.md' || ext === '.mdx') {
          const fm = parseFrontMatter(head);
          if (fm.title) title = fm.title;
          if (fm.keywords) fmKw = fm.keywords;
          if (fm.description) fmDesc = fm.description;
          if (fm.tags) fmTags = fm.tags;
          if (fm.date) fmDate = fm.date;
          if (!title) title = extractTitleFromMd(head.replace(/^---[\s\S]*?\n---\r?\n/, ''));
        } else if (ext === '.html' || ext === '.htm') {
          title = extractTitleFromHtml(head);
        } else if (ext === '.txt') {
          title = extractTitleFromTxt(head);
        }
        if (!title) {
          title = path.parse(filePath).name;
        }

        let keywords = fmKw || extractKeywords(head, 10);
        // mtime override by front-matter date if valid
        let mtimeMs = st.mtimeMs;
        if (fmDate) {
          const d = new Date(fmDate + 'T00:00:00Z');
          if (!isNaN(d.getTime())) {
            mtimeMs = d.getTime();
          }
        }
        const rec = {
          path: path.resolve(filePath),
          relPath,
          ext,
          sizeBytes: st.size,
          mtimeMs,
          title,
          slug: slugify(relPath),
          ...(fmDesc ? { description: fmDesc } : {}),
          ...(fmTags ? { tags: fmTags } : {}),
          ...(fmDate ? { date: fmDate } : {}),
          ...(keywords ? { keywords } : {}),
        };
        results.push(rec);
        indexedFiles++;
      } catch (e) {
        skippedError++;
        logWarn(`[skip] Error indexing file: ${relPath} (${e.message})`);
      }
    }
  }

  const durationMs = Date.now() - start;

  if (!dryRun) {
    const outAbs = path.isAbsolute(out) ? out : path.join(repoRoot, out);
    const outDir = path.dirname(outAbs);
    await fs.mkdir(outDir, { recursive: true });
    const json = JSON.stringify(results, null, 2);
    await fs.writeFile(outAbs, json, 'utf8');

    if (copyPublic) {
      const pubDir = path.join(repoRoot, 'public');
      await fs.mkdir(pubDir, { recursive: true });
      const pubPath = path.join(pubDir, 'content_index.json');
      if (path.resolve(pubPath) !== path.resolve(outAbs)) {
        await fs.writeFile(pubPath, json, 'utf8');
      }
    }
  }

  logInfo(quiet, `Scanned: ${scannedFiles} files`);
  logInfo(quiet, `Indexed: ${indexedFiles}`);
  logInfo(quiet, `Skipped: ext=${skippedExt}, binary=${skippedBinary}, large=${skippedLarge}, error=${skippedError}`);
  logInfo(quiet, `Duration: ${durationMs} ms`);

  return { scannedFiles, indexedFiles, skippedExt, skippedBinary, skippedLarge, skippedError, durationMs, results };
}

// ---------- Main ----------
(async function main() {
  let args;
  try {
    args = parseArgs(process.argv);
    if (args.help) {
      printHelp();
      process.exit(0);
      return;
    }
  } catch (e) {
    logError(e.message);
    printHelp();
    process.exit(1);
    return;
  }

  try {
    const { indexedFiles } = await indexPaths(args);
    if (indexedFiles === 0) {
      // Không coi là lỗi: cho phép repo không có file hợp lệ
      process.exit(0);
    } else {
      process.exit(0);
    }
  } catch (e) {
    if (e && e.code === 'NO_ROOTS') {
      logError('No valid roots to scan. Exiting.');
      process.exit(2);
      return;
    }
    logError('Unexpected error:', e?.message || e);
    process.exit(1);
  }
})();