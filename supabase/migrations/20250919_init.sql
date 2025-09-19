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
  user_id uuid not null,
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
create policy if not exists projects_select on public.projects
  for select using (auth.uid() = user_id);
create policy if not exists projects_insert on public.projects
  for insert with check (auth.uid() = user_id);
create policy if not exists projects_update on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists projects_delete on public.projects
  for delete using (auth.uid() = user_id);

-- profiles (map 1-1 theo user_id)
create policy if not exists profiles_select on public.profiles
  for select using (auth.uid() = user_id);
create policy if not exists profiles_upsert on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- content
create policy if not exists content_select on public.content
  for select using (auth.uid() = user_id);
create policy if not exists content_insert on public.content
  for insert with check (auth.uid() = user_id);
create policy if not exists content_update on public.content
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists content_delete on public.content
  for delete using (auth.uid() = user_id);

-- keywords: quyền theo project sở hữu bởi user
create policy if not exists keywords_select on public.keywords
  for select using (exists (
    select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()
  ));
create policy if not exists keywords_insert on public.keywords
  for insert with check (exists (
    select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()
  ));
create policy if not exists keywords_update on public.keywords
  for update using (exists (
    select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()
  ));
create policy if not exists keywords_delete on public.keywords
  for delete using (exists (
    select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()
  ));
