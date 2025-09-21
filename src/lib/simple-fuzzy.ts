export function simpleFuzzySearch(
  query: string,
  items: Array<{ id: string; title: string; content: string; keywords: string[] }>,
  opts?: { titleBoost?: number; keywordBoost?: number; contentBoost?: number }
): string[] {
  const titleBoost = opts?.titleBoost ?? 3;
  const keywordBoost = opts?.keywordBoost ?? 2;
  const contentBoost = opts?.contentBoost ?? 1;

  const norm = (s: string) => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const q = norm(query);
  if (!q) return [];
  const tokens = Array.from(new Set(q.split(' ').filter(Boolean)));

  const scored = items.map((it) => {
    const t = norm(it.title);
    const k = norm((it.keywords || []).join(' '));
    const c = norm(it.content || '');
    let score = 0;
    for (const tok of tokens) {
      if (t.includes(tok)) score += titleBoost;
      if (k.includes(tok)) score += keywordBoost;
      if (c.includes(tok)) score += contentBoost;
    }
    return { id: it.id, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.id);
}
