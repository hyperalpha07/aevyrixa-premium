-- Admin V2 audit/approvals finalization.
-- Additive only: preserves existing audit logs, creates approval infrastructure, and
-- grants only the runtime privileges required by server-mediated Admin V2 APIs.

alter table public.admin_staff_activity_logs add column if not exists actor_type text null;
alter table public.admin_staff_activity_logs add column if not exists actor_id text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.admin_staff_activity_logs'::regclass
      and conname = 'admin_staff_activity_logs_actor_type_valid'
  ) then
    alter table public.admin_staff_activity_logs
      add constraint admin_staff_activity_logs_actor_type_valid
      check (actor_type is null or actor_type in ('owner', 'staff', 'system'));
  end if;
end $$;

alter table public.admin_staff_activity_logs enable row level security;
revoke all on table public.admin_staff_activity_logs from public, anon, authenticated, service_role;
grant select, insert on table public.admin_staff_activity_logs to service_role;
drop policy if exists admin_staff_activity_logs_service_role_all on public.admin_staff_activity_logs;
drop policy if exists admin_staff_activity_logs_service_role_select on public.admin_staff_activity_logs;
drop policy if exists admin_staff_activity_logs_service_role_insert on public.admin_staff_activity_logs;
create policy admin_staff_activity_logs_service_role_select on public.admin_staff_activity_logs
  for select to service_role using (true);
create policy admin_staff_activity_logs_service_role_insert on public.admin_staff_activity_logs
  for insert to service_role with check (true);

create table if not exists public.admin_approval_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  title text not null,
  category text not null,
  action_key text not null,
  subject_type text null,
  subject_id text null,
  summary text not null,
  reason text not null,
  request_payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  requested_by_type text not null,
  requested_by_id text null,
  requested_by_name text not null,
  requested_at timestamptz not null default now(),
  resolved_by_type text null,
  resolved_by_id text null,
  resolved_by_name text null,
  resolved_at timestamptz null,
  resolution_note text null,
  updated_at timestamptz not null default now()
);

alter table public.admin_approval_requests add column if not exists reference text;
alter table public.admin_approval_requests add column if not exists title text;
alter table public.admin_approval_requests add column if not exists category text;
alter table public.admin_approval_requests add column if not exists action_key text;
alter table public.admin_approval_requests add column if not exists subject_type text null;
alter table public.admin_approval_requests add column if not exists subject_id text null;
alter table public.admin_approval_requests add column if not exists summary text;
alter table public.admin_approval_requests add column if not exists reason text;
alter table public.admin_approval_requests add column if not exists request_payload jsonb not null default '{}'::jsonb;
alter table public.admin_approval_requests add column if not exists status text not null default 'pending';
alter table public.admin_approval_requests add column if not exists requested_by_type text;
alter table public.admin_approval_requests add column if not exists requested_by_id text null;
alter table public.admin_approval_requests add column if not exists requested_by_name text;
alter table public.admin_approval_requests add column if not exists requested_at timestamptz not null default now();
alter table public.admin_approval_requests add column if not exists resolved_by_type text null;
alter table public.admin_approval_requests add column if not exists resolved_by_id text null;
alter table public.admin_approval_requests add column if not exists resolved_by_name text null;
alter table public.admin_approval_requests add column if not exists resolved_at timestamptz null;
alter table public.admin_approval_requests add column if not exists resolution_note text null;
alter table public.admin_approval_requests add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.admin_approval_requests'::regclass and conname = 'admin_approval_requests_status_valid') then
    alter table public.admin_approval_requests add constraint admin_approval_requests_status_valid check (status in ('pending', 'approved', 'rejected', 'cancelled'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.admin_approval_requests'::regclass and conname = 'admin_approval_requests_category_valid') then
    alter table public.admin_approval_requests add constraint admin_approval_requests_category_valid check (category in ('access', 'operations', 'finance', 'customer', 'content', 'settings', 'other'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.admin_approval_requests'::regclass and conname = 'admin_approval_requests_requested_by_type_valid') then
    alter table public.admin_approval_requests add constraint admin_approval_requests_requested_by_type_valid check (requested_by_type in ('owner', 'staff', 'system'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.admin_approval_requests'::regclass and conname = 'admin_approval_requests_resolved_by_type_valid') then
    alter table public.admin_approval_requests add constraint admin_approval_requests_resolved_by_type_valid check (resolved_by_type is null or resolved_by_type in ('owner', 'staff', 'system'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.admin_approval_requests'::regclass and conname = 'admin_approval_requests_text_valid') then
    alter table public.admin_approval_requests add constraint admin_approval_requests_text_valid check (
      length(btrim(reference)) between 8 and 40
      and length(btrim(title)) between 1 and 160
      and length(btrim(action_key)) between 1 and 120
      and action_key ~ '^[a-z0-9][a-z0-9._:-]{0,119}$'
      and length(btrim(summary)) between 1 and 1000
      and length(btrim(reason)) between 1 and 2000
      and (resolution_note is null or length(btrim(resolution_note)) <= 2000)
      and jsonb_typeof(request_payload) = 'object'
    );
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.admin_approval_requests'::regclass and conname = 'admin_approval_requests_terminal_resolution_valid') then
    alter table public.admin_approval_requests add constraint admin_approval_requests_terminal_resolution_valid check (
      (status = 'pending' and resolved_at is null)
      or (status in ('approved', 'rejected', 'cancelled') and resolved_at is not null and resolved_by_type is not null and resolved_by_name is not null)
    );
  end if;
end $$;

create unique index if not exists admin_approval_requests_reference_idx on public.admin_approval_requests (reference);
create index if not exists admin_approval_requests_status_requested_at_idx on public.admin_approval_requests (status, requested_at desc, id desc);
create index if not exists admin_approval_requests_requested_by_idx on public.admin_approval_requests (requested_by_type, requested_by_id);
create index if not exists admin_approval_requests_subject_idx on public.admin_approval_requests (subject_type, subject_id);

create table if not exists public.admin_approval_events (
  id uuid primary key default gen_random_uuid(),
  approval_id uuid not null references public.admin_approval_requests(id) on delete restrict,
  event_type text not null,
  actor_type text not null,
  actor_id text null,
  actor_name text not null,
  note text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.admin_approval_events'::regclass and conname = 'admin_approval_events_event_type_valid') then
    alter table public.admin_approval_events add constraint admin_approval_events_event_type_valid check (event_type in ('requested', 'approved', 'rejected', 'cancelled'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.admin_approval_events'::regclass and conname = 'admin_approval_events_actor_type_valid') then
    alter table public.admin_approval_events add constraint admin_approval_events_actor_type_valid check (actor_type in ('owner', 'staff', 'system'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.admin_approval_events'::regclass and conname = 'admin_approval_events_note_valid') then
    alter table public.admin_approval_events add constraint admin_approval_events_note_valid check ((note is null or length(btrim(note)) <= 2000) and jsonb_typeof(metadata) = 'object');
  end if;
end $$;

create index if not exists admin_approval_events_approval_created_idx on public.admin_approval_events (approval_id, created_at asc, id asc);

create or replace function public.admin_approval_request_event_trigger()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public'
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.admin_approval_events (approval_id, event_type, actor_type, actor_id, actor_name, metadata)
    values (new.id, 'requested', new.requested_by_type, new.requested_by_id, new.requested_by_name, jsonb_build_object('status', new.status));
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'pending' and new.status in ('approved', 'rejected', 'cancelled') and old.status is distinct from new.status then
    insert into public.admin_approval_events (approval_id, event_type, actor_type, actor_id, actor_name, note, metadata)
    values (
      new.id,
      new.status,
      coalesce(new.resolved_by_type, 'system'),
      new.resolved_by_id,
      coalesce(new.resolved_by_name, 'System'),
      new.resolution_note,
      jsonb_build_object('from_status', old.status, 'to_status', new.status)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists admin_approval_requests_event_trigger on public.admin_approval_requests;
create trigger admin_approval_requests_event_trigger
after insert or update on public.admin_approval_requests
for each row execute function public.admin_approval_request_event_trigger();

alter table public.admin_approval_requests enable row level security;
alter table public.admin_approval_events enable row level security;
revoke all on table public.admin_approval_requests from public, anon, authenticated, service_role;
revoke all on table public.admin_approval_events from public, anon, authenticated, service_role;
grant select, insert, update on table public.admin_approval_requests to service_role;
grant select, insert on table public.admin_approval_events to service_role;

drop policy if exists admin_approval_requests_service_role_all on public.admin_approval_requests;
drop policy if exists admin_approval_requests_service_role_select on public.admin_approval_requests;
drop policy if exists admin_approval_requests_service_role_insert on public.admin_approval_requests;
drop policy if exists admin_approval_requests_service_role_update on public.admin_approval_requests;
create policy admin_approval_requests_service_role_select on public.admin_approval_requests for select to service_role using (true);
create policy admin_approval_requests_service_role_insert on public.admin_approval_requests for insert to service_role with check (true);
create policy admin_approval_requests_service_role_update on public.admin_approval_requests for update to service_role using (true) with check (true);

drop policy if exists admin_approval_events_service_role_all on public.admin_approval_events;
drop policy if exists admin_approval_events_service_role_select on public.admin_approval_events;
drop policy if exists admin_approval_events_service_role_insert on public.admin_approval_events;
create policy admin_approval_events_service_role_select on public.admin_approval_events for select to service_role using (true);
create policy admin_approval_events_service_role_insert on public.admin_approval_events for insert to service_role with check (true);

do $$
begin
  if to_regclass('public.admin_roles') is not null then
    update public.admin_roles
      set permissions = coalesce(permissions, '{}'::jsonb) || '{"approvals.view": true, "approvals.request": true, "approvals.decide": true}'::jsonb
      where key = 'manager' and is_system = true;
    update public.admin_roles
      set permissions = coalesce(permissions, '{}'::jsonb) || '{"approvals.view": true, "approvals.request": true}'::jsonb
      where key in ('order_staff', 'product_staff', 'support_staff') and is_system = true;
  end if;
end $$;

revoke all on function public.admin_approval_request_event_trigger() from public, anon, authenticated, service_role;
