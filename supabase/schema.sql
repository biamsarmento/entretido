-- ============================================================
-- ENTRETIDO — Script único: apaga tudo e recria do zero
-- Cole tudo isso no SQL Editor e clique em Run
-- ============================================================

-- 1. Limpa tudo (ordem importa por causa das FKs)
drop table if exists public.watch_later cascade;
drop table if exists public.recommendations cascade;
drop table if exists public.group_members cascade;
drop table if exists public.groups cascade;
drop table if exists public.profiles cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_group_member(uuid) cascade;
drop function if exists public.is_group_member(uuid, uuid) cascade;

-- 2. Cria as tabelas e políticas

create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Profiles visíveis por todos" on public.profiles
  for select using (true);

create policy "Usuário pode inserir seu próprio perfil" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Usuário pode atualizar seu próprio perfil" on public.profiles
  for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  avatar_url text,
  invite_code text unique not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

alter table public.groups enable row level security;

create policy "Usuário autenticado pode criar grupo" on public.groups
  for insert with check (auth.uid() is not null);

create policy "Admin pode atualizar grupo" on public.groups
  for update using (created_by = auth.uid());

create table public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now() not null,
  unique(group_id, user_id)
);

alter table public.group_members enable row level security;

create or replace function public.is_group_member(group_uuid uuid, user_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members
    where group_id = group_uuid and user_id = user_uuid
  );
$$;

create policy "Membros podem ver membros do grupo" on public.group_members
  for select using (public.is_group_member(group_id, auth.uid()));

create policy "Usuário autenticado pode entrar em grupo" on public.group_members
  for insert with check (auth.uid() is not null);

create policy "Usuário pode sair do próprio grupo" on public.group_members
  for delete using (user_id = auth.uid());

create policy "Membros podem ver o grupo" on public.groups
  for select using (public.is_group_member(id, auth.uid()));

create table public.recommendations (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster_path text,
  overview text,
  release_date text,
  vote_average numeric,
  recommended_at timestamptz default now() not null,
  unique(group_id, tmdb_id, media_type)
);

alter table public.recommendations enable row level security;

create policy "Membros podem ver indicações" on public.recommendations
  for select using (public.is_group_member(group_id, auth.uid()));

create policy "Membros podem indicar" on public.recommendations
  for insert with check (
    auth.uid() = user_id and public.is_group_member(group_id, auth.uid())
  );

create policy "Quem indicou ou admin pode remover" on public.recommendations
  for delete using (
    user_id = auth.uid() or
    exists (
      select 1 from public.groups
      where id = recommendations.group_id and created_by = auth.uid()
    )
  );

create table public.watch_later (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster_path text,
  overview text,
  release_date text,
  vote_average numeric,
  added_at timestamptz default now() not null,
  unique(user_id, tmdb_id, media_type)
);

alter table public.watch_later enable row level security;

create table public.comments (
  id uuid default gen_random_uuid() primary key,
  recommendation_id uuid references public.recommendations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(content) > 0),
  created_at timestamptz default now() not null
);

alter table public.comments disable row level security;

create policy "Usuário vê sua própria lista" on public.watch_later
  for select using (user_id = auth.uid());

create policy "Usuário adiciona à sua lista" on public.watch_later
  for insert with check (user_id = auth.uid());

create policy "Usuário remove da sua lista" on public.watch_later
  for delete using (user_id = auth.uid());
