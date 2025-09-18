import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  target_audience: string | null;
  industry: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectFormData {
  name: string;
  description?: string;
  website_url?: string;
  target_audience?: string;
  industry?: string;
}

export const useProjectManager = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const localMode = String(((import.meta as any).env?.VITE_E2E_TEST_MODE ?? '')).toLowerCase() === 'true';
  const localKey = 'local-projects';

  const fetchProjects = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (localMode) {
        const raw = localStorage.getItem(localKey);
        const all = raw ? (JSON.parse(raw) as Project[]) : [];
        const userProjects = all.filter((p: any) => (p as any).user_id ? (p as any).user_id === (user as any).id : true);
        setProjects(userProjects);
        if (userProjects.length > 0 && !currentProject) {
          setCurrentProject(userProjects[0]);
        }
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      
      // Set first project as current if none selected
      if (data && data.length > 0 && !currentProject) {
        setCurrentProject(data[0]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Không thể tải danh sách dự án');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (formData: ProjectFormData) => {
    if (!user) throw new Error('User not authenticated');

    setSaving(true);
    try {
      if (localMode) {
        const now = new Date().toISOString();
        const newProject: Project & { user_id?: string } = {
          id: Math.random().toString(36).slice(2),
          name: formData.name,
          description: formData.description || null,
          website_url: formData.website_url || null,
          target_audience: formData.target_audience || null,
          industry: formData.industry || null,
          created_at: now,
          updated_at: now,
        } as any;
        (newProject as any).user_id = (user as any).id || 'test-user';
        const raw = localStorage.getItem(localKey);
        const list = raw ? JSON.parse(raw) : [];
        list.unshift(newProject);
        localStorage.setItem(localKey, JSON.stringify(list));
        toast.success('Tạo dự án thành công');
        await fetchProjects();
        setCurrentProject(newProject);
        return newProject;
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description || null,
          website_url: formData.website_url || null,
          target_audience: formData.target_audience || null,
          industry: formData.industry || null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Tạo dự án thành công');
      fetchProjects();
      setCurrentProject(data);
      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Tạo dự án thất bại');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateProject = async (id: string, updates: Partial<ProjectFormData>) => {
    setSaving(true);
    try {
      if (localMode) {
        const raw = localStorage.getItem(localKey);
        const list: any[] = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex((p) => p.id === id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
          localStorage.setItem(localKey, JSON.stringify(list));
        }
        toast.success('Cập nhật dự án thành công');
        await fetchProjects();
        return;
      }

      const { error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Cập nhật dự án thành công');
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Cập nhật dự án thất bại');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      if (localMode) {
        const raw = localStorage.getItem(localKey);
        const list: any[] = raw ? JSON.parse(raw) : [];
        const filtered = list.filter((p) => p.id !== id);
        localStorage.setItem(localKey, JSON.stringify(filtered));
        toast.success('Xóa dự án thành công');
        if (currentProject?.id === id) {
          setCurrentProject(null);
        }
        await fetchProjects();
        return;
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Xóa dự án thành công');
      
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
      
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Xóa dự án thất bại');
      throw error;
    }
  };

  const selectProject = (project: Project) => {
    setCurrentProject(project);
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  return {
    projects,
    currentProject,
    loading,
    saving,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    selectProject
  };
};