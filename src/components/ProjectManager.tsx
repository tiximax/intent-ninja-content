import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Globe, Target, Building, Check } from 'lucide-react';
import { useProjectManager } from '@/hooks/useProjectManager';

interface ProjectFormData {
  name: string;
  description: string;
  website_url: string;
  target_audience: string;
  industry: string;
}

export default function ProjectManager() {
  const { 
    projects, 
    currentProject, 
    loading, 
    saving, 
    createProject, 
    selectProject 
  } = useProjectManager();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    website_url: '',
    target_audience: '',
    industry: ''
  });

  const handleCreateProject = async () => {
    if (!formData.name.trim()) return;

    try {
      await createProject(formData);
      setIsDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        website_url: '',
        target_audience: '',
        industry: ''
      });
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quản lý dự án</h2>
        <div className="flex items-center gap-4">
          {currentProject && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Dự án hiện tại:</span>
              <Badge variant="outline">{currentProject.name}</Badge>
            </div>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo dự án mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tạo dự án mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên dự án *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên dự án"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả ngắn về dự án"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="target_audience">Đối tượng mục tiêu</Label>
                <Input
                  id="target_audience"
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  placeholder="Ví dụ: Doanh nghiệp SME, Gen Z..."
                />
              </div>
              
              <div>
                <Label htmlFor="industry">Ngành nghề</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="Ví dụ: E-commerce, SaaS, Fintech..."
                />
              </div>
              
              <Button 
                onClick={handleCreateProject} 
                disabled={saving || !formData.name.trim()}
                className="w-full"
              >
                {saving ? 'Đang tạo...' : 'Tạo dự án'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Current Project Selector */}
      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chọn dự án làm việc</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={currentProject?.id || ''}
              onValueChange={(value) => {
                const project = projects.find(p => p.id === value);
                if (project) selectProject(project);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn dự án để làm việc" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      {currentProject?.id === project.id && <Check className="h-4 w-4" />}
                      <span>{project.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Brand Defaults for current project */}
      {currentProject && (
        <Card>
          <CardHeader>
            <CardTitle>Brand defaults cho dự án hiện tại</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brand voice preset</Label>
                <Select defaultValue={(typeof window !== 'undefined' && localStorage.getItem(`brand-defaults-${currentProject.id}`)) ? (JSON.parse(localStorage.getItem(`brand-defaults-${currentProject.id}`) || '{}').brandVoicePreset || 'professional') : 'professional'} onValueChange={(val) => {
                  const raw = localStorage.getItem(`brand-defaults-${currentProject.id}`);
                  const cur = raw ? JSON.parse(raw) : {};
                  cur.brandVoicePreset = val;
                  localStorage.setItem(`brand-defaults-${currentProject.id}`, JSON.stringify(cur));
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Chuyên nghiệp</SelectItem>
                    <SelectItem value="friendly">Thân thiện</SelectItem>
                    <SelectItem value="authoritative">Authority</SelectItem>
                    <SelectItem value="storytelling">Kể chuyện</SelectItem>
                    <SelectItem value="direct">Ngắn gọn</SelectItem>
                    <SelectItem value="mybrand">Thương hiệu của tôi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Độ sâu mỗi mục</Label>
                <Select defaultValue={(typeof window !== 'undefined' && localStorage.getItem(`brand-defaults-${currentProject.id}`)) ? (JSON.parse(localStorage.getItem(`brand-defaults-${currentProject.id}`) || '{}').sectionDepth || 'deep') : 'deep'} onValueChange={(val) => {
                  const raw = localStorage.getItem(`brand-defaults-${currentProject.id}`);
                  const cur = raw ? JSON.parse(raw) : {};
                  cur.sectionDepth = val;
                  localStorage.setItem(`brand-defaults-${currentProject.id}`, JSON.stringify(cur));
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Cơ bản (1–2)</SelectItem>
                    <SelectItem value="standard">Chuẩn (2–3)</SelectItem>
                    <SelectItem value="deep">Sâu (3–5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
              <div className="space-y-2">
                <Label>Ngành (industry preset)</Label>
                <Select defaultValue={(typeof window !== 'undefined' && localStorage.getItem(`brand-defaults-${currentProject.id}`)) ? (JSON.parse(localStorage.getItem(`brand-defaults-${currentProject.id}`) || '{}').industryPreset || 'general') : 'general'} onValueChange={(val) => {
                  const raw = localStorage.getItem(`brand-defaults-${currentProject.id}`);
                  const cur = raw ? JSON.parse(raw) : {};
                  cur.industryPreset = val;
                  localStorage.setItem(`brand-defaults-${currentProject.id}`, JSON.stringify(cur));
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Chung (General)</SelectItem>
                    <SelectItem value="ecommerce">TMĐT / Bán hàng</SelectItem>
                    <SelectItem value="saas_b2b">SaaS B2B</SelectItem>
                    <SelectItem value="education">Giáo dục</SelectItem>
                    <SelectItem value="ordership_tiximax">Ordership – TIXIMAX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Brand voice (tùy chỉnh)</Label>
                <Textarea rows={3} defaultValue={(typeof window !== 'undefined' && localStorage.getItem(`brand-defaults-${currentProject.id}`)) ? (JSON.parse(localStorage.getItem(`brand-defaults-${currentProject.id}`) || '{}').brandCustomStyle || '') : ''} onChange={(e) => {
                  const raw = localStorage.getItem(`brand-defaults-${currentProject.id}`);
                  const cur = raw ? JSON.parse(raw) : {};
                  cur.brandCustomStyle = e.target.value;
                  localStorage.setItem(`brand-defaults-${currentProject.id}`, JSON.stringify(cur));
                }} />
              </div>
            <div className="text-sm text-muted-foreground">Đã lưu tự động. Trình tạo nội dung sẽ tự động prefill theo các giá trị này.</div>
          </CardContent>
        </Card>
      )}

      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Chưa có dự án nào</h3>
            <p className="text-muted-foreground mb-4">
              Tạo dự án đầu tiên để bắt đầu quản lý content SEO
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo dự án đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                currentProject?.id === project.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => selectProject(project)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  {currentProject?.id === project.id && (
                    <Badge variant="default">Đang sử dụng</Badge>
                  )}
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {project.website_url && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Globe className="h-4 w-4 mr-2" />
                    <span className="truncate">{project.website_url}</span>
                  </div>
                )}
                
                {project.target_audience && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Target className="h-4 w-4 mr-2" />
                    <span className="truncate">{project.target_audience}</span>
                  </div>
                )}
                
                {project.industry && (
                  <Badge variant="secondary">{project.industry}</Badge>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Tạo lúc: {new Date(project.created_at).toLocaleDateString('vi-VN')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}