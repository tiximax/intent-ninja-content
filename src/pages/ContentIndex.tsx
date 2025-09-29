import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

// Kiểu dữ liệu bản ghi index (khớp với scripts/index-content.mjs)
type IndexRecord = {
  path: string;
  relPath: string;
  ext: string;
  sizeBytes: number;
  mtimeMs: number;
  title: string;
  slug: string;
  description?: string;
  tags?: string[];
  keywords?: string[];
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${sizes[i]}`;
}

const ContentIndex: React.FC = () => {
  const [data, setData] = useState<IndexRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState<'modified' | 'title' | 'size' | 'description'>('modified');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [sortKeys, setSortKeys] = useState<{ key: 'modified' | 'title' | 'size' | 'tags' | 'keywords'; dir: 'asc' | 'desc' }[]>([{ key: 'modified', dir: 'desc' }]);
  const [extFilter, setExtFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError(null);
        const res = await fetch('/content_index.json', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`Không tìm thấy content_index.json (HTTP ${res.status}). Hãy chạy: npm run index:content:public`);
        }
        const json = await res.json();
        if (!Array.isArray(json)) throw new Error('Định dạng JSON không hợp lệ.');
        if (alive) setData(json as IndexRecord[]);
      } catch (e: any) {
        if (alive) setError(e?.message || String(e));
      }
    })();
    return () => { alive = false; };
  }, []);

  const exts = useMemo(() => {
    const s = new Set<string>();
    (data || []).forEach(r => s.add(r.ext));
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    let items = data;
    if (extFilter !== 'all') {
      items = items.filter(r => r.ext === extFilter);
    }
    if (!term) return items;
    return items.filter(r =>
      r.title.toLowerCase().includes(term) ||
      r.relPath.toLowerCase().includes(term) ||
      (r.keywords?.some(k => k.toLowerCase().includes(term)) ?? false)
    );
  }, [data, q, extFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const keys = sortKeys.length ? sortKeys : [{ key: sortBy, dir: sortDir }];
      for (const k of keys) {
        let comp = 0;
        if (k.key === 'modified') comp = a.mtimeMs - b.mtimeMs;
        else if (k.key === 'title') comp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        else if (k.key === 'size') comp = a.sizeBytes - b.sizeBytes;
        else if (k.key === 'description') comp = (a.description || '').localeCompare((b.description || ''), undefined, { sensitivity: 'base' });
        else if (k.key === 'tags') {
          const at = (a.tags || []).join('|');
          const bt = (b.tags || []).join('|');
          comp = at.localeCompare(bt, undefined, { sensitivity: 'base' });
        } else if (k.key === 'keywords') {
          const ak = (a.keywords || []).join('|');
          const bk = (b.keywords || []).join('|');
          comp = ak.localeCompare(bk, undefined, { sensitivity: 'base' });
        }
        if (comp !== 0) return k.dir === 'asc' ? comp : -comp;
      }
      return 0;
    });
    return arr;
  }, [filtered, sortBy, sortDir, sortKeys]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(sorted.length / pageSize)), [sorted.length, pageSize]);

  // Clamp page to totalPages when data/filters change
  useEffect(() => {
    setPage(p => {
      const clamped = Math.max(1, Math.min(p, totalPages));
      return clamped;
    });
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  // Reset trang khi filter/sort thay đổi (không reset theo data)
  useEffect(() => { setPage(1); }, [q, extFilter, sortBy, sortDir, pageSize]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('contentIndexPrefs');
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p === 'object') {
          if (typeof p.q === 'string') setQ(p.q);
          if (p.sortBy === 'modified' || p.sortBy === 'title' || p.sortBy === 'size') setSortBy(p.sortBy);
          if (p.sortDir === 'asc' || p.sortDir === 'desc') setSortDir(p.sortDir);
          if (Array.isArray(p.sortKeys)) setSortKeys(p.sortKeys);
          if (typeof p.extFilter === 'string') setExtFilter(p.extFilter);
          if (typeof p.pageSize === 'number' && [10,25,50,100].includes(p.pageSize)) setPageSize(p.pageSize);
          if (typeof p.page === 'number' && p.page >= 1) setPage(p.page);
        }
      }
    } catch { /* no-op: reading preferences may fail (private mode) */ }
  }, []);

  // Persist preferences when changed
  useEffect(() => {
    try {
      localStorage.setItem('contentIndexPrefs', JSON.stringify({ q, sortBy, sortDir, sortKeys, extFilter, pageSize, page }));
    } catch { /* no-op: writing preferences may fail */ }
  }, [q, sortBy, sortDir, sortKeys, extFilter, pageSize, page]);

  const getCsv = () => {
    const rows = [
      ['title', 'relPath', 'ext', 'sizeBytes', 'mtimeIso', 'date', 'tags', 'keywords']
    ] as string[][];
    for (const r of sorted) {
      rows.push([
        r.title,
        r.relPath,
        r.ext,
        String(r.sizeBytes),
        new Date(r.mtimeMs).toISOString(),
        // optional front-matter date if present
        ((r as any).date || ''),
        (r.tags || []).join('|'),
        (r.keywords || []).join('|')
      ]);
    }
    const csv = rows.map(cols => cols.map(v => {
      const s = String(v ?? '');
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    }).join(',')).join('\n');
    return csv;
  };

  const downloadCsv = () => {
    const csv = getCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content_index.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCsvToClipboard = async () => {
    try {
      const csv = getCsv();
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(csv);
      } else {
        const ta = document.createElement('textarea');
        ta.value = csv;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast.success('Đã copy CSV vào clipboard');
    } catch (e) {
      console.error(e);
      toast.error('Copy CSV thất bại');
    }
  };

  const copyJsonToClipboard = async () => {
    try {
      const json = JSON.stringify(sorted, null, 2);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(json);
      } else {
        const ta = document.createElement('textarea');
        ta.value = json;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast.success('Đã copy JSON (filtered) vào clipboard');
    } catch (e) {
      console.error(e);
      toast.error('Copy JSON thất bại');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content Index</h1>
        <div className="text-sm text-muted-foreground">
          {data ? `${filtered.length} of ${data.length} files` : '...'}
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo title, path, keywords..."
                className="max-w-md"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                Nếu chưa có dữ liệu, chạy: <code>npm run index:content:public</code>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border rounded px-2 py-1 text-sm bg-background"
>
                  <option value="modified">Modified</option>
                  <option value="title">Title</option>
                  <option value="description">Description</option>
                  <option value="size">Size</option>
                </select>
                <Button variant="outline" size="sm" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
                  {sortDir === 'asc' ? 'Asc' : 'Desc'}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Ext</label>
                <select
                  value={extFilter}
                  onChange={(e) => setExtFilter(e.target.value)}
                  className="border rounded px-2 py-1 text-sm bg-background"
                >
                  <option value="all">All</option>
                  {exts.map(ex => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Page size</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border rounded px-2 py-1 text-sm bg-background"
                >
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

                <div className="ml-auto flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => {
                      setQ('');
                      setExtFilter('all');
                      setSortBy('modified');
                      setSortDir('desc');
                      setSortKeys([{ key: 'modified', dir: 'desc' }]);
                      setPageSize(25);
                      setPage(1);
                    }}>Reset filters</Button>
                  </TooltipTrigger>
                  <TooltipContent>Đưa mọi bộ lọc về mặc định</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={copyCsvToClipboard}>Copy CSV</Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy CSV vào clipboard</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={copyJsonToClipboard}>Copy JSON</Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy JSON (filtered) vào clipboard</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" onClick={downloadCsv}>Export CSV</Button>
                  </TooltipTrigger>
                  <TooltipContent>Tải CSV xuống máy</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          {!error && !data && (
            <div className="text-sm text-muted-foreground">Đang tải dữ liệu...</div>
          )}

          {!error && data && (
            <>
              <div className="overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                    <TableHead className="min-w-[220px]">
                      <button
                        className={"inline-flex items-center gap-1 hover:underline " + (sortKeys.find(k => k.key === 'title') ? 'font-semibold' : '')}
                        onClick={(e) => {
                          const isShift = (e as any).shiftKey;
                          if (!isShift) {
                            setSortBy(prev => {
                              if (prev === 'title') { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev; }
                              setSortDir('asc');
                              return 'title';
                            });
                            setSortKeys([{ key: 'title', dir: 'asc' }]);
                          } else {
                            setSortKeys(prev => {
                              const idx = prev.findIndex(p => p.key === 'title');
                              if (idx >= 0) {
                                const next = [...prev];
                                next[idx] = { key: 'title', dir: next[idx].dir === 'asc' ? 'desc' : 'asc' };
                                return next;
                              }
                              return [...prev, { key: 'title', dir: 'asc' }];
                            });
                          }
                        }}
                        title="Sort by Title (Shift+Click to add as secondary)"
                      >
                        Title {(() => { const s = sortKeys.findIndex(k => k.key === 'title'); return s >= 0 ? (sortKeys[s].dir === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>) : <ArrowUpDown className="w-4 h-4 opacity-50"/>; })()} {(() => { const s = sortKeys.findIndex(k => k.key === 'title'); return s >= 0 ? <span className="text-xs opacity-70">({s+1})</span> : null; })()}
                      </button>
                    </TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>
                        <button
                          className={"inline-flex items-center gap-1 hover:underline " + (sortKeys.find(k => k.key === 'description') ? 'font-semibold' : '')}
                          onClick={(e) => {
                            const isShift = (e as any).shiftKey;
                            if (!isShift) {
                              setSortBy('description');
                              setSortDir('asc');
                              setSortKeys([{ key: 'description', dir: 'asc' }]);
                            } else {
                              setSortKeys(prev => {
                                const idx = prev.findIndex(p => p.key === 'description');
                                if (idx >= 0) {
                                  const next = [...prev];
                                  next[idx] = { key: 'description', dir: next[idx].dir === 'asc' ? 'desc' : 'asc' };
                                  return next;
                                }
                                return [...prev, { key: 'description', dir: 'asc' }];
                              });
                            }
                          }}
                          title="Sort by Description (Shift+Click to add)"
                        >
                          Description {(() => { const s = sortKeys.findIndex(k => k.key === 'description'); return s >= 0 ? (sortKeys[s].dir === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>) : <ArrowUpDown className="w-4 h-4 opacity-50"/>; })()} {(() => { const s = sortKeys.findIndex(k => k.key === 'description'); return s >= 0 ? <span className="text-xs opacity-70">({s+1})</span> : null; })()}
                        </button>
                      </TableHead>
                      <TableHead>Ext</TableHead>
                      <TableHead>
                      <button
                        className={"inline-flex items-center gap-1 hover:underline " + (sortKeys.find(k => k.key === 'size') ? 'font-semibold' : '')}
                        onClick={(e) => {
                          const isShift = (e as any).shiftKey;
                          if (!isShift) {
                            setSortBy(prev => {
                              if (prev === 'size') { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev; }
                              setSortDir('desc');
                              return 'size';
                            });
                            setSortKeys([{ key: 'size', dir: 'desc' }]);
                          } else {
                            setSortKeys(prev => {
                              const idx = prev.findIndex(p => p.key === 'size');
                              if (idx >= 0) {
                                const next = [...prev];
                                next[idx] = { key: 'size', dir: next[idx].dir === 'asc' ? 'desc' : 'asc' };
                                return next;
                              }
                              return [...prev, { key: 'size', dir: 'desc' }];
                            });
                          }
                        }}
                        title="Sort by Size (Shift+Click to add as secondary)"
                      >
                        Size {(() => { const s = sortKeys.findIndex(k => k.key === 'size'); return s >= 0 ? (sortKeys[s].dir === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>) : <ArrowUpDown className="w-4 h-4 opacity-50"/>; })()} {(() => { const s = sortKeys.findIndex(k => k.key === 'size'); return s >= 0 ? <span className="text-xs opacity-70">({s+1})</span> : null; })()}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className={"inline-flex items-center gap-1 hover:underline " + (sortKeys.find(k => k.key === 'modified') ? 'font-semibold' : '')}
                        onClick={(e) => {
                          const isShift = (e as any).shiftKey;
                          if (!isShift) {
                            setSortBy(prev => {
                              if (prev === 'modified') { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev; }
                              setSortDir('desc');
                              return 'modified';
                            });
                            setSortKeys([{ key: 'modified', dir: 'desc' }]);
                          } else {
                            setSortKeys(prev => {
                              const idx = prev.findIndex(p => p.key === 'modified');
                              if (idx >= 0) {
                                const next = [...prev];
                                next[idx] = { key: 'modified', dir: next[idx].dir === 'asc' ? 'desc' : 'asc' };
                                return next;
                              }
                              return [...prev, { key: 'modified', dir: 'desc' }];
                            });
                          }
                        }}
                        title="Sort by Modified (Shift+Click to add as secondary)"
                      >
                        Modified {(() => { const s = sortKeys.findIndex(k => k.key === 'modified'); return s >= 0 ? (sortKeys[s].dir === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>) : <ArrowUpDown className="w-4 h-4 opacity-50"/>; })()} {(() => { const s = sortKeys.findIndex(k => k.key === 'modified'); return s >= 0 ? <span className="text-xs opacity-70">({s+1})</span> : null; })()}
                      </button>
                    </TableHead>
                      <TableHead>Tags</TableHead>
                    <TableHead>
                      <button
                        className={"inline-flex items-center gap-1 hover:underline " + (sortKeys.find(k => k.key === 'tags') ? 'font-semibold' : '')}
                        onClick={(e) => {
                          const isShift = (e as any).shiftKey;
                          if (!isShift) {
                            setSortBy('modified'); // giữ sortBy chuẩn
                            setSortDir('desc');
                            setSortKeys([{ key: 'tags', dir: 'asc' }]);
                          } else {
                            setSortKeys(prev => {
                              const idx = prev.findIndex(p => p.key === 'tags');
                              if (idx >= 0) {
                                const next = [...prev];
                                next[idx] = { key: 'tags', dir: next[idx].dir === 'asc' ? 'desc' : 'asc' };
                                return next;
                              }
                              return [...prev, { key: 'tags', dir: 'asc' }];
                            });
                          }
                        }}
                        title="Sort by Tags (Shift+Click to add)"
                      >
                        Tags {(() => { const s = sortKeys.findIndex(k => k.key === 'tags'); return s >= 0 ? (sortKeys[s].dir === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>) : <ArrowUpDown className="w-4 h-4 opacity-50"/>; })()} {(() => { const s = sortKeys.findIndex(k => k.key === 'tags'); return s >= 0 ? <span className="text-xs opacity-70">({s+1})</span> : null; })()}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className={"inline-flex items-center gap-1 hover:underline " + (sortKeys.find(k => k.key === 'keywords') ? 'font-semibold' : '')}
                        onClick={(e) => {
                          const isShift = (e as any).shiftKey;
                          if (!isShift) {
                            setSortBy('modified');
                            setSortDir('desc');
                            setSortKeys([{ key: 'keywords', dir: 'asc' }]);
                          } else {
                            setSortKeys(prev => {
                              const idx = prev.findIndex(p => p.key === 'keywords');
                              if (idx >= 0) {
                                const next = [...prev];
                                next[idx] = { key: 'keywords', dir: next[idx].dir === 'asc' ? 'desc' : 'asc' };
                                return next;
                              }
                              return [...prev, { key: 'keywords', dir: 'asc' }];
                            });
                          }
                        }}
                        title="Sort by Keywords (Shift+Click to add)"
                      >
                        Keywords {(() => { const s = sortKeys.findIndex(k => k.key === 'keywords'); return s >= 0 ? (sortKeys[s].dir === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>) : <ArrowUpDown className="w-4 h-4 opacity-50"/>; })()} {(() => { const s = sortKeys.findIndex(k => k.key === 'keywords'); return s >= 0 ? <span className="text-xs opacity-70">({s+1})</span> : null; })()}
                      </button>
                    </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageItems.map((r) => (
                      <TableRow key={r.relPath}>
                        <TableCell className="font-medium">{r.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.relPath}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate" title={r.description || ''}>{r.description || '-'}</TableCell>
                        <TableCell>{r.ext}</TableCell>
                        <TableCell>{formatBytes(r.sizeBytes)}</TableCell>
                        <TableCell>{new Date(r.mtimeMs).toLocaleString()}</TableCell>
                        <TableCell className="space-x-1">
                          {r.tags?.slice(0, 5).map(k => (
                            <Badge key={k} variant="secondary">{k}</Badge>
                          ))}
                        </TableCell>
                        <TableCell className="space-x-1">
                          {r.keywords?.slice(0, 5).map(k => (
                            <Badge key={k} variant="outline">{k}</Badge>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
                <div>
                  {sorted.length > 0 ? (
                    <span>
                      Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, sorted.length)} of {sorted.length}
                    </span>
                  ) : (
                    <span>No results</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
                  <span>Page {page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentIndex;
