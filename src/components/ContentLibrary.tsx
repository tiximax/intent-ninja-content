import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { simpleFuzzySearch } from '@/lib/simple-fuzzy';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Search, 
  Edit2, 
  Trash2, 
  Eye,
  Star,
  Calendar,
  BarChart3,
  Filter,
  Copy,
  Download,
  Mic,
  MicOff
} from 'lucide-react';
import { useContentManager } from '@/hooks/useContentManager';
import { useProjectManager } from '@/hooks/useProjectManager';
import { useAuth } from '@/hooks/useAuth';

export default function ContentLibrary() {
  const { user } = useAuth();
  const { contents, loading, deleteContent, updateContent, fetchContents } = useContentManager();
  const { currentProject, projects } = useProjectManager();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('current'); // 'current' | 'all' | projectId
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [minWords, setMinWords] = useState<string>('');
  const [maxWords, setMaxWords] = useState<string>('');
  const [minScore, setMinScore] = useState<string>('');
  const [maxScore, setMaxScore] = useState<string>('');
  const [hasTOC, setHasTOC] = useState<boolean>(false);
  const [hasFAQ, setHasFAQ] = useState<boolean>(false);
  const [kwContains, setKwContains] = useState<string>('');
  const [bodyContains, setBodyContains] = useState<string>('');
  const [titleOnly, setTitleOnly] = useState<boolean>(false);

  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Voice search state
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  const startVoiceSearch = () => {
    try {
      const W: any = window as any;
      const SR = W.webkitSpeechRecognition || W.SpeechRecognition;
      if (!SR) {
        // Fallback: do nothing if not supported
        return;
      }
      const rec = new SR();
      recognitionRef.current = rec;
      rec.lang = 'vi-VN';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (event: any) => {
        try {
          const transcript = event?.results?.[0]?.[0]?.transcript || '';
          if (transcript) setSearchTerm(transcript);
        } catch {}
      };
      rec.onerror = () => { setIsListening(false); };
      rec.onend = () => { setIsListening(false); };
      setIsListening(true);
      rec.start();
    } catch {
      setIsListening(false);
    }
  };

  const stopVoiceSearch = () => {
    try { recognitionRef.current?.stop?.(); } catch {}
    setIsListening(false);
  };

  const baseFiltered = useMemo(() => {
    // Project matching by filter
    const matchProject = (c: any) => {
      if (projectFilter === 'all') return true;
      if (projectFilter === 'current') return !currentProject || c.project_id === currentProject.id;
      return c.project_id === projectFilter;
    };
    return contents.filter(content => {
      const matchesStatus = statusFilter === 'all' || content.status === statusFilter;
      const matchesProject = matchProject(content);
      return matchesStatus && matchesProject;
    });
  }, [contents, statusFilter, projectFilter, currentProject]);

  const advancedFiltered = useMemo(() => {
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : undefined;
    const toTsRaw = dateTo ? new Date(dateTo).getTime() : undefined;
    const toTs = typeof toTsRaw === 'number' ? (toTsRaw + (24 * 60 * 60 * 1000) - 1) : undefined; // inclusive end-of-day
    const minW = minWords ? parseInt(minWords, 10) : undefined;
    const maxW = maxWords ? parseInt(maxWords, 10) : undefined;
    const minS = minScore ? parseInt(minScore, 10) : undefined;
    const maxS = maxScore ? parseInt(maxScore, 10) : undefined;

    return baseFiltered.filter(c => {
      const t = new Date(c.updated_at).getTime();
      if (fromTs && t < fromTs) return false;
      if (toTs && t > toTs) return false;
      if (typeof minS === 'number' && (c.seo_score ?? -1) < minS) return false;
      if (typeof maxS === 'number' && (c.seo_score ?? 101) > maxS) return false;
      // Word count & TOC/FAQ from content body
      const html = String(c.content_body || '');
      const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const words = text ? text.split(/\s+/).length : 0;
      const toc = /mục lục|table of contents|id=\"muc-luc\"/i.test(html);
      const faq = /<h2[^>]*>\s*FAQ\s*<\/h2>/i.test(html) || /FAQ/i.test(html);
      if (typeof minW === 'number' && words < minW) return false;
      if (typeof maxW === 'number' && words > maxW) return false;
      if (hasTOC && !toc) return false;
      if (hasFAQ && !faq) return false;
      if (kwContains) {
        const kw = String(kwContains).toLowerCase();
        const arr = Array.isArray(c.target_keywords) ? c.target_keywords : [];
        const hit = arr.some((k: string) => String(k || '').toLowerCase().includes(kw));
        if (!hit) return false;
      }
      if (bodyContains) {
        const needle = String(bodyContains).toLowerCase();
        const normalizedText = text.toLowerCase();
        if (!normalizedText.includes(needle)) return false;
      }
      return true;
    });
  }, [baseFiltered, dateFrom, dateTo, minWords, maxWords, minScore, maxScore, hasTOC, hasFAQ, kwContains, bodyContains]);

  const filteredContents = useMemo(() => {
    const q = searchTerm.trim();
    if (q.length < 2) return advancedFiltered;

    if (titleOnly) {
      const norm = (s: string) => s
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const tokens = Array.from(new Set(norm(q).split(' ').filter(Boolean)));
      const scored = advancedFiltered.map(c => {
        const t = norm(c.title || '');
        let score = 0;
        for (const tok of tokens) { if (t.includes(tok)) score += 1; }
        return { id: c.id, score };
      }).filter(s => s.score > 0).sort((a,b)=>b.score-a.score);
      const order = new Map(scored.map((s, i) => [s.id, i]));
      return advancedFiltered.filter(c => order.has(c.id)).sort((a,b)=> (order.get(a.id)! - order.get(b.id)!));
    }

    // Fuzzy rank by title, content_body (text), target_keywords
    const list = advancedFiltered.map((c) => ({
      id: c.id,
      title: c.title || '',
      content: String(c.content_body || ''),
      keywords: Array.isArray(c.target_keywords) ? c.target_keywords : [],
      _raw: c,
    }));
    const ids = simpleFuzzySearch(q, list, { titleBoost: 3, keywordBoost: 2, contentBoost: 1 });
    const map = new Map(ids.map((id, idx) => [id, idx]));
    const result = advancedFiltered.filter((c) => map.has(c.id)).sort((a, b) => (map.get(a.id)! - map.get(b.id)!));
    return result;
  }, [advancedFiltered, searchTerm, titleOnly]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'Đã xuất bản';
      case 'draft':
        return 'Bản nháp';
      case 'archived':
        return 'Lưu trữ';
      default:
        return status;
    }
  };

  const handleStatusChange = async (contentId: string, newStatus: string) => {
    await updateContent(contentId, { status: newStatus as 'draft' | 'published' | 'archived' });
  };

  const handleDelete = async (contentId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa nội dung này?')) {
      await deleteContent(contentId);
    }
  };

  const addToRecentlyViewed = (content: any) => {
    try {
      const key = 'recent-contents';
      const raw = localStorage.getItem(key);
      const list: any[] = raw ? JSON.parse(raw) : [];
      const item = {
        id: content.id,
        title: content.title,
        updated_at: content.updated_at,
        seo_score: content.seo_score ?? null,
        snippet: (content.meta_description || content.content_body?.slice(0, 180) || '').toString(),
      };
      const filtered = list.filter((x) => x.id !== content.id);
      filtered.unshift(item);
      const limited = filtered.slice(0, 10);
      localStorage.setItem(key, JSON.stringify(limited));
    } catch {}
  };

  const openPreview = (content: any) => {
    setSelectedContent(content);
    setIsPreviewOpen(true);
    addToRecentlyViewed(content);
  };

  useEffect(() => {
    // Tự động tải danh sách nội dung (local mode dùng 'test-user' làm mặc định)
    const uid = (user as any)?.id || 'test-user';
    const pid = projectFilter === 'all' ? undefined : (projectFilter === 'current' ? currentProject?.id : projectFilter);
    fetchContents(pid, uid);
  }, [currentProject, user, projectFilter]);

  // Initialize from URL params on first render
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const st = searchParams.get('status') || 'all';
    const pj = searchParams.get('project') || 'current';
    const df = searchParams.get('from') || '';
    const dt = searchParams.get('to') || '';
    const minw = searchParams.get('minWords') || '';
    const maxw = searchParams.get('maxWords') || '';
    const mins = searchParams.get('minScore') || '';
    const maxs = searchParams.get('maxScore') || '';
    const toc = searchParams.get('toc') === '1';
    const faq = searchParams.get('faq') === '1';
    const kw = searchParams.get('kw') || '';
    const body = searchParams.get('body') || '';
    const tonly = searchParams.get('titleOnly') === '1';
    setSearchTerm(q);
    setStatusFilter(st);
    setProjectFilter(pj);
    setDateFrom(df);
    setDateTo(dt);
    setMinWords(minw);
    setMaxWords(maxw);
    setMinScore(mins);
    setMaxScore(maxs);
    setHasTOC(toc);
    setHasFAQ(faq);
    setKwContains(kw);
    setBodyContains(body);
    setTitleOnly(tonly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync URL params when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchTerm) params.q = searchTerm;
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
    if (projectFilter && projectFilter !== 'current') params.project = projectFilter;
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    if (minWords) params.minWords = minWords;
    if (maxWords) params.maxWords = maxWords;
    if (minScore) params.minScore = minScore;
    if (maxScore) params.maxScore = maxScore;
    if (hasTOC) params.toc = '1';
    if (hasFAQ) params.faq = '1';
    if (kwContains) params.kw = kwContains;
    if (bodyContains) params.body = bodyContains;
    if (titleOnly) params.titleOnly = '1';
    setSearchParams(params);
  }, [searchTerm, statusFilter, projectFilter, dateFrom, dateTo, minWords, maxWords, minScore, maxScore, hasTOC, hasFAQ, kwContains, bodyContains, titleOnly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const set = new Set(prev);
      if (checked) set.add(id); else set.delete(id);
      return Array.from(set);
    });
  };

  const getStats = (htmlOrText: string) => {
    const html = String(htmlOrText || '');
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text ? text.split(/\s+/).length : 0;
    const h2Count = (html.match(/<h2\b/gi) || []).length;
    const h3Count = (html.match(/<h3\b/gi) || []).length;
    const hasTOC = /mục lục|table of contents|id=\"muc-luc\"/i.test(html);
    const hasFAQ = /<h2[^>]*>\s*FAQ\s*<\/h2>/i.test(html) || /FAQ/i.test(html);
    return { words, h2Count, h3Count, hasTOC, hasFAQ };
  };

  const selectedContents = filteredContents.filter(c => selectedIds.includes(c.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Thư viện nội dung</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={selectedIds.length < 2}
            onClick={() => setIsCompareOpen(true)}
            data-testid="compare-open"
          >
            So sánh ({selectedIds.length})
          </Button>
          <div className="relative flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm nội dung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="library-search"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={isListening ? 'Dừng tìm kiếm giọng nói' : 'Tìm kiếm bằng giọng nói'}
              aria-pressed={isListening}
              onClick={() => (isListening ? stopVoiceSearch() : startVoiceSearch())}
              data-testid="library-voice-btn"
            >
              {isListening ? <MicOff className="h-4 w-4 text-red-600" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32" data-testid="library-filter-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="published">Đã xuất bản</SelectItem>
              <SelectItem value="archived">Lưu trữ</SelectItem>
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-40" data-testid="library-filter-project">
              <SelectValue placeholder="Dự án" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Dự án hiện tại{currentProject ? `: ${currentProject.name}` : ''}</SelectItem>
              <SelectItem value="all">Tất cả dự án</SelectItem>
              {projects && projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" data-testid="library-filter-toggle">
            <Filter className="h-4 w-4 mr-1" /> Bộ lọc
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); } catch {} }}
            data-testid="library-copy-filter-url"
          >
            <Copy className="h-4 w-4 mr-1" /> Sao chép URL lọc
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 p-3 border rounded-md bg-muted/30" data-testid="library-filter-panel">
        <div>
          <label className="text-xs text-muted-foreground">Từ ngày</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} data-testid="library-filter-from" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Đến ngày</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} data-testid="library-filter-to" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Số từ tối thiểu</label>
          <Input type="number" min={0} placeholder="min" value={minWords} onChange={(e) => setMinWords(e.target.value)} data-testid="library-filter-minwords" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Số từ tối đa</label>
          <Input type="number" min={0} placeholder="max" value={maxWords} onChange={(e) => setMaxWords(e.target.value)} data-testid="library-filter-maxwords" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">SEO score tối thiểu</label>
          <Input type="number" min={0} max={100} placeholder="min" value={minScore} onChange={(e) => setMinScore(e.target.value)} data-testid="library-filter-minscore" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">SEO score tối đa</label>
          <Input type="number" min={0} max={100} placeholder="max" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} data-testid="library-filter-maxscore" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Keyword chứa</label>
          <Input type="text" placeholder="iphone, canon..." value={kwContains} onChange={(e) => setKwContains(e.target.value)} data-testid="library-filter-kw" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Nội dung chứa</label>
          <Input type="text" placeholder="từ khóa trong nội dung..." value={bodyContains} onChange={(e) => setBodyContains(e.target.value)} data-testid="library-filter-body" />
        </div>
        <div className="col-span-1 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox id="has-toc" checked={hasTOC} onCheckedChange={(v) => setHasTOC(Boolean(v))} data-testid="library-filter-toc" />
            <label htmlFor="has-toc" className="text-sm">Có TOC</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="has-faq" checked={hasFAQ} onCheckedChange={(v) => setHasFAQ(Boolean(v))} data-testid="library-filter-faq" />
            <label htmlFor="has-faq" className="text-sm">Có FAQ</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="title-only" checked={titleOnly} onCheckedChange={(v) => setTitleOnly(Boolean(v))} data-testid="library-filter-title-only" />
            <label htmlFor="title-only" className="text-sm">Chỉ tìm tiêu đề</label>
          </div>
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => {
            setSearchTerm(''); setStatusFilter('all'); setProjectFilter('current'); setDateFrom(''); setDateTo(''); setMinWords(''); setMaxWords(''); setMinScore(''); setMaxScore(''); setHasTOC(false); setHasFAQ(false); setKwContains(''); setBodyContains(''); setTitleOnly(false);
          }} data-testid="library-filter-clear">Xóa bộ lọc</Button>
        </div>
      </div>

      {filteredContents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">
              {contents.length === 0 ? 'Chưa có nội dung nào' : 'Không tìm thấy nội dung phù hợp'}
            </h3>
            <p className="text-muted-foreground">
              {contents.length === 0 
                ? 'Tạo nội dung đầu tiên từ trang Dashboard'
                : 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContents.map((content) => (
            <Card key={content.id} className="hover:shadow-md transition-shadow" data-testid="library-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">{content.title}</CardTitle>
                  <Badge className={getStatusColor(content.status)}>
                    {getStatusLabel(content.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {content.meta_description || content.content_body.substring(0, 150) + '...'}
                </p>
                
                {content.target_keywords && content.target_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {content.target_keywords.slice(0, 3).map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {content.target_keywords.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{content.target_keywords.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <Checkbox
                    checked={selectedIds.includes(content.id)}
                    onCheckedChange={(v) => toggleSelect(content.id, Boolean(v))}
                    data-testid={`select-content-${content.id}`}
                    className="mr-2"
                  />
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(content.updated_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {content.seo_score && (
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>{content.seo_score}%</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPreview(content)}
                    data-testid={`open-quick-view-${content.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Xem
                  </Button>
                  
                  <Select
                    value={content.status}
                    onValueChange={(value) => handleStatusChange(content.id, value)}
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Nháp</SelectItem>
                      <SelectItem value="published">Xuất bản</SelectItem>
                      <SelectItem value="archived">Lưu trữ</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(content.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="quick-view-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedContent?.title}</span>
              {selectedContent?.seo_score != null && (
                <span className="text-sm text-muted-foreground">SEO: {selectedContent.seo_score}%</span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedContent && (
            <div className="space-y-4">
              {selectedContent.meta_description && (
                <div>
                  <h4 className="font-semibold mb-2">Meta Description</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {selectedContent.meta_description}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Tóm tắt</h4>
                <p className="text-sm text-foreground bg-background border rounded-md p-3">
                  {(selectedContent.content_body || '').slice(0, 300)}{(selectedContent.content_body || '').length > 300 ? '…' : ''}
                </p>
              </div>

              {selectedContent.target_keywords && selectedContent.target_keywords.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedContent.target_keywords.map((keyword: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => { try { await navigator.clipboard.writeText(selectedContent.content_body || ''); } catch {} }}
                  data-testid="quick-view-copy"
                >
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const htmlContent = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${selectedContent.title}</title><meta name="description" content="${selectedContent.meta_description || ''}"></head><body>${selectedContent.content_body}</body></html>`;
                    const blob = new Blob([htmlContent], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${(selectedContent.title || 'noi-dung').replace(/\s+/g, '-').toLowerCase()}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  data-testid="quick-view-export-html"
                >
                  <Download className="h-4 w-4 mr-1" /> Export HTML
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
        <DialogContent className="max-w-4xl" data-testid="compare-dialog">
          <DialogHeader>
            <DialogTitle>So sánh nội dung ({selectedContents.length})</DialogTitle>
          </DialogHeader>
          {selectedContents.length >= 2 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2">Tiêu đề</th>
                    <th className="text-left p-2">Số từ</th>
                    <th className="text-left p-2">H2</th>
                    <th className="text-left p-2">H3</th>
                    <th className="text-left p-2">TOC</th>
                    <th className="text-left p-2">FAQ</th>
                    <th className="text-left p-2">SEO</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedContents.map((c) => {
                    const s = getStats(c.content_body);
                    return (
                      <tr key={c.id} data-testid={`compare-row-${c.id}`} className="border-t">
                        <td className="p-2 max-w-[260px] truncate" title={c.title}>{c.title}</td>
                        <td className="p-2">{s.words}</td>
                        <td className="p-2">{s.h2Count}</td>
                        <td className="p-2">{s.h3Count}</td>
                        <td className="p-2">{s.hasTOC ? 'Có' : 'Không'}</td>
                        <td className="p-2">{s.hasFAQ ? 'Có' : 'Không'}</td>
                        <td className="p-2">{typeof c.seo_score === 'number' ? `${c.seo_score}%` : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Chọn ít nhất 2 nội dung để so sánh.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}