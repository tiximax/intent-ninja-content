import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Download
} from 'lucide-react';
import { useContentManager } from '@/hooks/useContentManager';
import { useProjectManager } from '@/hooks/useProjectManager';
import { useAuth } from '@/hooks/useAuth';

export default function ContentLibrary() {
  const { user } = useAuth();
  const { contents, loading, deleteContent, updateContent, fetchContents } = useContentManager();
  const { currentProject } = useProjectManager();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const filteredContents = contents.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.content_body.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || content.status === statusFilter;
    const matchesProject = !currentProject || content.project_id === currentProject.id;
    
    return matchesSearch && matchesStatus && matchesProject;
  });

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
    fetchContents(currentProject?.id, uid);
  }, [currentProject, user]);

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="published">Đã xuất bản</SelectItem>
              <SelectItem value="archived">Lưu trữ</SelectItem>
            </SelectContent>
          </Select>
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
            <Card key={content.id} className="hover:shadow-md transition-shadow">
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