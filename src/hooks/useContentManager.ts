import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SavedContent {
  id: string;
  project_id: string;
  title: string;
  content_body: string;
  meta_description: string | null;
  target_keywords: string[];
  seo_score: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ContentRequest {
  projectId: string;
  title: string;
  content: string;
  metaDescription?: string;
  keywords?: string[];
  seoScore?: number;
  status?: 'draft' | 'published' | 'archived';
}

export const useContentManager = () => {
  const [contents, setContents] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const localMode = String(((import.meta as any).env?.VITE_E2E_TEST_MODE ?? '')).toLowerCase() === 'true';
  const localKey = 'local-content';

  const fetchContents = async (projectId?: string, userId?: string) => {
    if (!userId) return;

    setLoading(true);
    try {
      if (localMode) {
        const raw = localStorage.getItem(localKey);
        const list: any[] = raw ? JSON.parse(raw) : [];
        const filtered = list.filter((c) => (!projectId || c.project_id === projectId) && (!userId || c.user_id === userId));
        setContents(filtered);
        return;
      }
      // Execute query directly without complex object building
      let query = (supabase as any).from('content').select('*').eq('user_id', userId);
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching contents:', error);
      toast.error('Không thể tải danh sách nội dung');
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async (request: ContentRequest, userId: string) => {
    if (!userId && !localMode) throw new Error('User not authenticated');

    setSaving(true);
    try {
      if (localMode) {
        const now = new Date().toISOString();
        const raw = localStorage.getItem(localKey);
        const list: any[] = raw ? JSON.parse(raw) : [];
        const newItem = {
          id: Math.random().toString(36).slice(2),
          user_id: userId || 'test-user',
          project_id: request.projectId,
          title: request.title,
          content_body: request.content,
          meta_description: request.metaDescription || null,
          target_keywords: request.keywords || [],
          seo_score: request.seoScore || null,
          status: request.status || 'draft',
          created_at: now,
          updated_at: now,
        };
        list.unshift(newItem);
        localStorage.setItem(localKey, JSON.stringify(list));
        toast.success('Lưu nội dung thành công');
        return newItem;
      }

      const { data, error } = await (supabase as any)
        .from('content')
        .insert({
          user_id: userId,
          project_id: request.projectId,
          title: request.title,
          content_body: request.content,
          meta_description: request.metaDescription || null,
          target_keywords: request.keywords || [],
          seo_score: request.seoScore || null,
          status: request.status || 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Lưu nội dung thành công');
      return data;
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Lưu nội dung thất bại');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateContent = async (id: string, updates: Partial<ContentRequest>) => {
    setSaving(true);
    try {
      if (localMode) {
        const raw = localStorage.getItem(localKey);
        const list: any[] = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex((c) => c.id === id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
          localStorage.setItem(localKey, JSON.stringify(list));
        }
        toast.success('Cập nhật nội dung thành công');
        return;
      }

      const { error } = await (supabase as any)
        .from('content')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Cập nhật nội dung thành công');
    } catch (error) {
      console.error('Error updating content:', error);
      toast.error('Cập nhật nội dung thất bại');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteContent = async (id: string) => {
    try {
      if (localMode) {
        const raw = localStorage.getItem(localKey);
        const list: any[] = raw ? JSON.parse(raw) : [];
        const filtered = list.filter((c) => c.id !== id);
        localStorage.setItem(localKey, JSON.stringify(filtered));
        toast.success('Xóa nội dung thành công');
        return;
      }

      const { error } = await (supabase as any)
        .from('content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Xóa nội dung thành công');
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Xóa nội dung thất bại');
      throw error;
    }
  };

  return {
    contents,
    loading,
    saving,
    fetchContents,
    saveContent,
    updateContent,
    deleteContent
  };
};