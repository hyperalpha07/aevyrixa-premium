-- Admin V2 return/exchange case workflow. Never posts refunds or mutates orders.
-- Service-role server access only. All existing TEST orders remain untouched.
create table if not exists public.admin_return_cases (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null unique references public.orders(order_ref) on update cascade on delete restrict,
  record_scope text not null default 'live' check (record_scope = 'live'),
  requested_action text not null check (requested_action in ('exchange', 'refund_review', 'support')),
  reason text not null check (length(btrim(reason)) between 10 and 1500),
  status text not null default 'requested' check (status in ('requested','reviewing','approved','rejected','closed')),
  hygiene_review text not null default 'not_checked' check (hygiene_review in ('not_checked','eligible','ineligible','exception_review')),
  review_note text not null default '' check (length(review_note) <= 2000),
  actor_name text not null check (length(btrim(actor_name)) between 2 and 120),
  version integer not null default 1 check (version between 1 and 2147483647),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_return_case_events (
  id bigint generated always as identity primary key,
  case_id uuid not null references public.admin_return_cases(id) on delete restrict,
  from_status text,
  to_status text not null,
  hygiene_review text not null,
  actor_name text not null,
  review_note text not null default '',
  recorded_at timestamptz not null default now()
);
create index if not exists admin_return_cases_status_created_idx on public.admin_return_cases(status,created_at desc);
create index if not exists admin_return_case_events_case_idx on public.admin_return_case_events(case_id,id desc);

create or replace function public.admin_return_case_guard()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
declare v_order record;
begin
  if tg_op = 'INSERT' then
    select o.record_scope, o.status, o.delivery_status into v_order
      from public.orders o where o.order_ref = new.order_ref for share;
    if not found or v_order.record_scope <> 'live' then
      raise exception 'Only existing LIVE customer orders may have return cases';
    end if;
    if v_order.status <> 'Delivered' and coalesce(v_order.delivery_status,'') not in ('delivered','returned') then
      raise exception 'A return case requires a delivered order';
    end if;
    if new.status <> 'requested' or new.version <> 1 or new.hygiene_review <> 'not_checked' then
      raise exception 'New return cases must start requested, version 1 and not checked';
    end if;
    new.updated_at := now();
  else
    if new.id is distinct from old.id or new.order_ref is distinct from old.order_ref or
       new.record_scope is distinct from old.record_scope or new.requested_action is distinct from old.requested_action or
       new.reason is distinct from old.reason or new.created_at is distinct from old.created_at then
      raise exception 'Immutable return case fields cannot be changed';
    end if;
    if new.version <> old.version + 1 then
      raise exception 'Return case optimistic version mismatch';
    end if;
    if (old.status = 'requested' and new.status <> 'reviewing') or
       (old.status = 'reviewing' and new.status not in ('approved','rejected')) or
       (old.status in ('approved','rejected') and new.status <> 'closed') or
       (old.status = 'closed') or new.status = old.status then
      raise exception 'Invalid return case status transition';
    end if;
    if new.status = 'approved' and new.hygiene_review not in ('eligible','exception_review') then
      raise exception 'Approval requires documented hygiene eligibility review';
    end if;
    if length(btrim(new.review_note)) < 8 then
      raise exception 'A meaningful review note is required for every status change';
    end if;
    new.updated_at := now();
  end if;
  return new;
end $$;

create or replace function public.admin_return_case_record_event()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.admin_return_case_events(case_id,from_status,to_status,hygiene_review,actor_name,review_note)
    values(new.id,null,new.status,new.hygiene_review,new.actor_name,new.review_note);
  else
    insert into public.admin_return_case_events(case_id,from_status,to_status,hygiene_review,actor_name,review_note)
    values(new.id,old.status,new.status,new.hygiene_review,new.actor_name,new.review_note);
  end if;
  return new;
end $$;

drop trigger if exists admin_return_case_guard_trigger on public.admin_return_cases;
create trigger admin_return_case_guard_trigger before insert or update on public.admin_return_cases
for each row execute function public.admin_return_case_guard();
drop trigger if exists admin_return_case_event_trigger on public.admin_return_cases;
create trigger admin_return_case_event_trigger after insert or update on public.admin_return_cases
for each row execute function public.admin_return_case_record_event();

alter table public.admin_return_cases enable row level security;
alter table public.admin_return_case_events enable row level security;
revoke all on public.admin_return_cases from public, anon, authenticated;
revoke all on public.admin_return_case_events from public, anon, authenticated;
grant select,insert,update on public.admin_return_cases to service_role;
grant select,insert on public.admin_return_case_events to service_role;
grant usage, select on sequence public.admin_return_case_events_id_seq to service_role;
revoke all on function public.admin_return_case_guard() from public, anon, authenticated;
revoke all on function public.admin_return_case_record_event() from public, anon, authenticated;
