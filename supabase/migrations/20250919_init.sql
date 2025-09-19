-- 20250919_init.sql
-- Khởi tạo tối thiểu schema cho ứng dụng: projects, profiles, content, keywords
-- Bao gồm RLS policies cơ bản cho multi-tenant theo user_id

-- Phụ thuộc extension để tạo UUID ngẫu nhiên
create extension if not exists pgcrypto;

-- Bảng projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  description text,
  website_url text,
  target_audience text,
  industry text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Bảng profiles (gắn với auth.users)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null,
  display_name text,
  avatar_url text,
  email text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Bảng content
create table if not exists public.content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  content_body text not null,
  meta_description text,
  target_keywords text[] default '{}',
  seo_score int,
  status text default 'draft',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
-- Ensure user_id exists for legacy schemas where content table pre-existed without this column
alter table public.content add column if not exists user_id uuid;

-- Bảng keywords
create table if not exists public.keywords (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  keyword text not null,
  search_volume int,
  difficulty_score int,
  cpc numeric,
  intent_type text,
  competition_level text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes hữu ích
create index if not exists idx_projects_user on public.projects(user_id);
create index if not exists idx_content_user on public.content(user_id);
create index if not exists idx_content_project on public.content(project_id);
create index if not exists idx_keywords_project on public.keywords(project_id);

-- RLS
alter table public.projects enable row level security;
alter table public.profiles enable row level security;
alter table public.content enable row level security;
alter table public.keywords enable row level security;

-- Policies: chỉ cho phép user thao tác trên dữ liệu của chính họ
-- projects
DROP POLICY IF EXISTS projects_select ON public.projects;
CREATE POLICY projects_select ON public.projects
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS projects_insert ON public.projects;
CREATE POLICY projects_insert ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS projects_update ON public.projects;
CREATE POLICY projects_update ON public.projects
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS projects_delete ON public.projects;
CREATE POLICY projects_delete ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- profiles (map 1-1 theo user_id)
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS profiles_upsert ON public.profiles;
CREATE POLICY profiles_upsert ON public.profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- content
DROP POLICY IF EXISTS content_select ON public.content;
CREATE POLICY content_select ON public.content
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS content_insert ON public.content;
CREATE POLICY content_insert ON public.content
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS content_update ON public.content;
CREATE POLICY content_update ON public.content
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS content_delete ON public.content;
CREATE POLICY content_delete ON public.content
  FOR DELETE USING (auth.uid() = user_id);

-- keywords: quyền theo project sở hữu bởi user
DROP POLICY IF EXISTS keywords_select ON public.keywords;
CREATE POLICY keywords_select ON public.keywords
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS keywords_insert ON public.keywords;
CREATE POLICY keywords_insert ON public.keywords
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS keywords_update ON public.keywords;
CREATE POLICY keywords_update ON public.keywords
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS keywords_delete ON public.keywords;
CREATE POLICY keywords_delete ON public.keywords
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
  ));
