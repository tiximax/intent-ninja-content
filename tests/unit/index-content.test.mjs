#!/usr/bin/env node
// Minimal unit test for Content Indexer
// - Verifies title extraction from .md, .html, .txt
// - Verifies slug formatting ends with expected filename part
// No external deps; uses Node built-ins only.

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

async function main() {
  const repoRoot = process.cwd();
  const tmpRoot = path.join(repoRoot, 'tests', 'tmp_indexer');
  // Cleanup if exists
  await fs.rm(tmpRoot, { recursive: true, force: true });
  await fs.mkdir(tmpRoot, { recursive: true });

  // Create sample files
  const mdPath = path.join(tmpRoot, 'a.md');
  const mdFmPath = path.join(tmpRoot, 'fm.md');
  const htmlPath = path.join(tmpRoot, 'b.html');
  const txtPath = path.join(tmpRoot, 'notes.txt');

  await fs.writeFile(mdPath, `# Tiêu đề Đẹp\nNội dung seo content SEO test.`, 'utf8');
  await fs.writeFile(mdFmPath, `---\ntitle: Tiêu đề FM\nkeywords:\n - seo\n - content\n---\n# Heading\nBody`, 'utf8');
  await fs.writeFile(htmlPath, `<!doctype html><html><head><title>SEO Basics</title></head><body><h1>Heading</h1></body></html>`, 'utf8');
  await fs.writeFile(txtPath, `Ghi chú thử nghiệm\nDòng 2`, 'utf8');

  const outPath = path.join(tmpRoot, 'out.json');

  const run = spawnSync(process.execPath, [
    'scripts/index-content.mjs',
    '--root', tmpRoot,
    '--out', outPath,
  ], { encoding: 'utf8' });

  if (run.error) {
    console.error('Spawn error:', run.error);
    process.exit(1);
  }
  if (run.status !== 0) {
    console.error('Indexer exited with code', run.status);
    console.error(run.stdout || '');
    console.error(run.stderr || '');
    process.exit(run.status || 1);
  }

  const json = await fs.readFile(outPath, 'utf8');
  const data = JSON.parse(json);

  // Helper to find by relPath suffix (normalize Windows backslashes)
  const norm = (s) => (s || '').replace(/\\/g, '/');
  const findBySuffix = (suffix) => data.find(r => norm(r.relPath).endsWith(suffix));

  const mdRec = findBySuffix('tests/tmp_indexer/a.md');
  assert(mdRec, 'a.md record not found');
  assert(mdRec.ext === '.md', 'a.md ext mismatch');
  assert(mdRec.title === 'Tiêu đề Đẹp', `a.md title mismatch: ${mdRec.title}`);
  assert(mdRec.slug && mdRec.slug.endsWith('a-md'), `a.md slug should end with a-md, got: ${mdRec.slug}`);

  const fmRec = findBySuffix('tests/tmp_indexer/fm.md');
  assert(fmRec, 'fm.md record not found');
  assert(fmRec.title === 'Tiêu đề FM', `fm.md front-matter title mismatch: ${fmRec.title}`);
  assert(Array.isArray(fmRec.keywords) && fmRec.keywords.includes('seo') && fmRec.keywords.includes('content'), 'fm.md keywords not parsed');

  const htmlRec = findBySuffix('tests/tmp_indexer/b.html');
  assert(htmlRec, 'b.html record not found');
  assert(htmlRec.ext === '.html', 'b.html ext mismatch');
  assert(htmlRec.title === 'SEO Basics', `b.html title mismatch: ${htmlRec.title}`);

  const txtRec = findBySuffix('tests/tmp_indexer/notes.txt');
  assert(txtRec, 'notes.txt record not found');
  assert(txtRec.ext === '.txt', 'notes.txt ext mismatch');
  assert(txtRec.title === 'Ghi chú thử nghiệm', `notes.txt title mismatch: ${txtRec.title}`);

  // Exclude globs test
  const skipPath = path.join(tmpRoot, 'skip.md');
  await fs.writeFile(skipPath, `# Should be skipped`, 'utf8');
  const out2 = path.join(tmpRoot, 'out2.json');
  const run2 = spawnSync(process.execPath, [
    'scripts/index-content.mjs',
    '--root', tmpRoot,
    '--out', out2,
    '--exclude-globs', '*skip.md'
  ], { encoding: 'utf8' });
  if (run2.status !== 0) {
    console.error('Indexer (exclude-globs) exited with code', run2.status);
    process.exit(run2.status || 1);
  }
  const json2 = await fs.readFile(out2, 'utf8');
  const data2 = JSON.parse(json2);
  const hasSkip = data2.some(r => norm(r.relPath).endsWith('tests/tmp_indexer/skip.md'));
  assert(!hasSkip, 'exclude-globs did not exclude skip.md');

  console.log('Index content tests passed');

  // Cleanup
  await fs.rm(tmpRoot, { recursive: true, force: true });
}

main().catch((e) => {
  console.error('Test failed:', e?.message || e);
  process.exit(1);
});
