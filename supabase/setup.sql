-- AfricaGo Launch Control Cloud
-- Run this entire file once in Supabase Dashboard -> SQL Editor.
-- Safe to re-run for most objects; review before using on an existing database.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  join_code text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.workspace_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  project_name text not null default 'AfricaGo Launch',
  project_start_date date,
  people jsonb not null default '[]'::jsonb check (jsonb_typeof(people) = 'array'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.tasks (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 140),
  status text not null default 'Not started' check (status in ('Not started','In progress','Blocked','Done')),
  assignee text not null default 'Unassigned',
  due_date date,
  priority text not null default 'Medium' check (priority in ('High','Medium','Low')),
  category text not null default 'General',
  milestone text not null default 'Ongoing',
  notes text not null default '',
  relative_day integer,
  seeded boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  task_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_enabled boolean not null default true,
  due_today boolean not null default true,
  due_tomorrow boolean not null default true,
  overdue boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_deliveries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  delivery_date date not null,
  kind text not null default 'daily-digest',
  created_at timestamptz not null default now(),
  unique (user_id, workspace_id, delivery_date, kind)
);

create index if not exists workspace_members_user_idx on public.workspace_members(user_id);
create index if not exists tasks_workspace_due_idx on public.tasks(workspace_id, due_date);
create index if not exists tasks_workspace_updated_idx on public.tasks(workspace_id, updated_at desc);
create index if not exists activity_workspace_created_idx on public.activity_log(workspace_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email,''), '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end,
        updated_at = now();

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_workspace_member(_workspace_id uuid, _user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = _workspace_id and user_id = _user_id
  );
$$;

create or replace function public.is_workspace_admin(_workspace_id uuid, _user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = _workspace_id
      and user_id = _user_id
      and role in ('owner','admin')
  );
$$;

create or replace function public.shares_workspace(_other_user uuid, _user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members mine
    join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = _user_id and theirs.user_id = _other_user
  );
$$;

revoke all on function public.is_workspace_member(uuid,uuid) from public;
revoke all on function public.is_workspace_admin(uuid,uuid) from public;
revoke all on function public.shares_workspace(uuid,uuid) from public;
grant execute on function public.is_workspace_member(uuid,uuid) to authenticated;
grant execute on function public.is_workspace_admin(uuid,uuid) to authenticated;
grant execute on function public.shares_workspace(uuid,uuid) to authenticated;

create or replace function public.create_workspace(p_name text)
returns table(workspace_id uuid, workspace_name text, join_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_workspace uuid := gen_random_uuid();
  v_code text;
  v_name text := left(trim(coalesce(p_name,'AfricaGo')), 80);
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;
  if v_name = '' then v_name := 'AfricaGo'; end if;

  loop
    v_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (select 1 from public.workspaces w where w.join_code = v_code);
  end loop;

  insert into public.workspaces(id, name, join_code, created_by)
  values(v_workspace, v_name, v_code, v_user);

  insert into public.workspace_members(workspace_id, user_id, role)
  values(v_workspace, v_user, 'owner');

  insert into public.workspace_settings(workspace_id, project_name, people, updated_by)
  values(
    v_workspace,
    v_name || ' Launch',
    jsonb_build_array(
      'Farai Shimeih Gwapedza',
      'Panashe Gwapedza',
      'Takunda Tavonga Gwapedza',
      'Unassigned'
    ),
    v_user
  );

  return query select v_workspace, v_name, v_code;
end;
$$;

create or replace function public.join_workspace(p_code text)
returns table(workspace_id uuid, workspace_name text, join_code text, member_role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_workspace public.workspaces%rowtype;
begin
  if v_user is null then raise exception 'You must be signed in.'; end if;

  select * into v_workspace
  from public.workspaces
  where join_code = upper(trim(p_code));

  if v_workspace.id is null then raise exception 'Invalid workspace join code.'; end if;

  insert into public.workspace_members(workspace_id, user_id, role)
  values(v_workspace.id, v_user, 'member')
  on conflict (workspace_id, user_id) do nothing;

  return query select v_workspace.id, v_workspace.name, v_workspace.join_code, 'member'::text;
end;
$$;

create or replace function public.rotate_workspace_join_code(p_workspace_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_code text;
begin
  if not public.is_workspace_admin(p_workspace_id) then raise exception 'Admin permission required.'; end if;
  loop
    v_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (select 1 from public.workspaces where join_code = v_code);
  end loop;
  update public.workspaces set join_code = v_code, updated_at = now() where id = p_workspace_id;
  return v_code;
end;
$$;

revoke all on function public.create_workspace(text) from public;
revoke all on function public.join_workspace(text) from public;
revoke all on function public.rotate_workspace_join_code(uuid) from public;
grant execute on function public.create_workspace(text) to authenticated;
grant execute on function public.join_workspace(text) to authenticated;
grant execute on function public.rotate_workspace_join_code(uuid) to authenticated;

create or replace function public.prepare_task_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
    new.created_at := coalesce(new.created_at, now());
  end if;
  new.updated_by := auth.uid();
  new.updated_at := now();
  new.client_updated_at := coalesce(new.client_updated_at, now());
  if new.status = 'Done' and new.completed_at is null then new.completed_at := now(); end if;
  if new.status <> 'Done' then new.completed_at := null; end if;
  return new;
end;
$$;

drop trigger if exists tasks_prepare_write on public.tasks;
create trigger tasks_prepare_write
before insert or update on public.tasks
for each row execute function public.prepare_task_write();

create or replace function public.prepare_settings_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists settings_prepare_write on public.workspace_settings;
create trigger settings_prepare_write
before insert or update on public.workspace_settings
for each row execute function public.prepare_settings_write();

create or replace function public.audit_task_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace uuid;
  v_task uuid;
  v_details jsonb;
begin
  if tg_op = 'DELETE' then
    v_workspace := old.workspace_id;
    v_task := old.id;
    v_details := jsonb_build_object('old_title', old.title, 'old_status', old.status);
  else
    v_workspace := new.workspace_id;
    v_task := new.id;
    v_details := jsonb_build_object('title', new.title, 'status', new.status, 'assignee', new.assignee);
  end if;

  insert into public.activity_log(workspace_id, actor_id, action, task_id, details)
  values(v_workspace, auth.uid(), tg_op, v_task, v_details);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists tasks_activity_log on public.tasks;
create trigger tasks_activity_log
after insert or update or delete on public.tasks
for each row execute function public.audit_task_change();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_log enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_deliveries enable row level security;

-- Drop/recreate policies for repeatable setup.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using (id = auth.uid() or public.shares_workspace(id));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces for select to authenticated
using (public.is_workspace_member(id));
drop policy if exists workspaces_update on public.workspaces;
create policy workspaces_update on public.workspaces for update to authenticated
using (public.is_workspace_admin(id)) with check (public.is_workspace_admin(id));

drop policy if exists members_select on public.workspace_members;
create policy members_select on public.workspace_members for select to authenticated
using (public.is_workspace_member(workspace_id));
drop policy if exists members_update on public.workspace_members;
create policy members_update on public.workspace_members for update to authenticated
using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));
drop policy if exists members_delete on public.workspace_members;
create policy members_delete on public.workspace_members for delete to authenticated
using (user_id = auth.uid() or public.is_workspace_admin(workspace_id));

drop policy if exists settings_select on public.workspace_settings;
create policy settings_select on public.workspace_settings for select to authenticated
using (public.is_workspace_member(workspace_id));
drop policy if exists settings_insert on public.workspace_settings;
create policy settings_insert on public.workspace_settings for insert to authenticated
with check (public.is_workspace_member(workspace_id));
drop policy if exists settings_update on public.workspace_settings;
create policy settings_update on public.workspace_settings for update to authenticated
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated
using (public.is_workspace_member(workspace_id));
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated
with check (public.is_workspace_member(workspace_id));
drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists activity_select on public.activity_log;
create policy activity_select on public.activity_log for select to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists notification_preferences_select on public.notification_preferences;
create policy notification_preferences_select on public.notification_preferences for select to authenticated
using (user_id = auth.uid());
drop policy if exists notification_preferences_insert on public.notification_preferences;
create policy notification_preferences_insert on public.notification_preferences for insert to authenticated
with check (user_id = auth.uid());
drop policy if exists notification_preferences_update on public.notification_preferences;
create policy notification_preferences_update on public.notification_preferences for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notification_deliveries_select on public.notification_deliveries;
create policy notification_deliveries_select on public.notification_deliveries for select to authenticated
using (user_id = auth.uid());

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on public.profiles, public.workspaces, public.workspace_members, public.workspace_settings, public.tasks, public.notification_preferences to authenticated;
grant select on public.activity_log, public.notification_deliveries to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter table public.tasks replica identity full;
alter table public.workspace_settings replica identity full;
alter table public.activity_log replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks') then
    alter publication supabase_realtime add table public.tasks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'workspace_settings') then
    alter publication supabase_realtime add table public.workspace_settings;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'activity_log') then
    alter publication supabase_realtime add table public.activity_log;
  end if;
end $$;

-- Backfill profiles if users existed before this SQL was run.
insert into public.profiles(id, email, full_name)
select id, email, coalesce(nullif(raw_user_meta_data ->> 'full_name',''), split_part(coalesce(email,''),'@',1))
from auth.users
on conflict (id) do nothing;

insert into public.notification_preferences(user_id)
select id from auth.users
on conflict (user_id) do nothing;
