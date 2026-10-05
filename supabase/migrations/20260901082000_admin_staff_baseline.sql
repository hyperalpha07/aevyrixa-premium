-- P0 baseline 3: Admin V2 staff and activity logs.
-- Reproduces the current production-compatible staff contract without seeding staff data.

create table if not exists public.admin_staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text null,
  username text null,
  password_hash text null,
  role text not null default 'viewer',
  permissions jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by text null,
  last_login_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_staff add column if not exists name text not null default '';
alter table public.admin_staff add column if not exists email text null;
alter table public.admin_staff add column if not exists username text null;
alter table public.admin_staff add column if not exists password_hash text null;
alter table public.admin_staff add column if not exists role text not null default 'viewer';
alter table public.admin_staff add column if not exists permissions jsonb not null default '{}'::jsonb;
alter table public.admin_staff add column if not exists is_active boolean not null default true;
alter table public.admin_staff add column if not exists created_by text null;
alter table public.admin_staff add column if not exists last_login_at timestamptz null;
alter table public.admin_staff add column if not exists created_at timestamptz not null default now();
alter table public.admin_staff add column if not exists updated_at timestamptz not null default now();


do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.admin_staff'::regclass and conname = 'admin_staff_username_key') then
    alter table public.admin_staff add constraint admin_staff_username_key unique (username);
  end if;
end $$;

create index if not exists admin_staff_username_idx on public.admin_staff (username);
create index if not exists admin_staff_role_idx on public.admin_staff (role);
create index if not exists admin_staff_is_active_idx on public.admin_staff (is_active);

create table if not exists public.admin_staff_activity_logs (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid null references public.admin_staff(id) on delete set null,
  actor_name text null,
  action text not null,
  target_type text null,
  target_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_staff_activity_logs add column if not exists staff_id uuid null;
alter table public.admin_staff_activity_logs add column if not exists actor_name text null;
alter table public.admin_staff_activity_logs add column if not exists action text not null default 'unknown';
alter table public.admin_staff_activity_logs add column if not exists target_type text null;
alter table public.admin_staff_activity_logs add column if not exists target_id text null;
alter table public.admin_staff_activity_logs add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.admin_staff_activity_logs add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.admin_staff_activity_logs'::regclass and conname = 'admin_staff_activity_logs_staff_id_fkey') then
    alter table public.admin_staff_activity_logs add constraint admin_staff_activity_logs_staff_id_fkey foreign key (staff_id) references public.admin_staff(id) on delete set null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'admin_staff'
      and column_name in ('email', 'username', 'password_hash')
      and is_nullable <> 'YES'
  ) then
    raise exception 'admin_staff email/username/password_hash must remain nullable for production compatibility';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'admin_staff'
      and column_name = 'role'
      and column_default = '''viewer''::text'
  ) then
    raise exception 'admin_staff.role must default to viewer';
  end if;

  if exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'admin_staff'
      and indexdef ilike '%lower(username)%'
  ) then
    raise exception 'admin_staff username uniqueness must not use lower(username)';
  end if;
end $$;

create index if not exists admin_staff_activity_logs_staff_id_idx on public.admin_staff_activity_logs (staff_id);
create index if not exists admin_staff_activity_logs_created_at_idx on public.admin_staff_activity_logs (created_at desc);

alter table public.admin_staff enable row level security;
alter table public.admin_staff_activity_logs enable row level security;
revoke all on table public.admin_staff from public, anon, authenticated, service_role;
revoke all on table public.admin_staff_activity_logs from public, anon, authenticated, service_role;
grant select, insert, update on table public.admin_staff to service_role;
grant select, insert on table public.admin_staff_activity_logs to service_role;
drop policy if exists admin_staff_service_role_all on public.admin_staff;
create policy admin_staff_service_role_all on public.admin_staff for all to service_role using (true) with check (true);
drop policy if exists admin_staff_activity_logs_service_role_all on public.admin_staff_activity_logs;
create policy admin_staff_activity_logs_service_role_all on public.admin_staff_activity_logs for all to service_role using (true) with check (true);

