-- Server-admin work management. Calendar shows real due dates on these tasks.
-- No cron, emails, finance changes or third-party calendar integrations.
create table if not exists public.admin_work_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check(length(btrim(title)) between 3 and 160),
  description text not null default '' check(length(description)<=2000),
  task_status text not null default 'todo' check(task_status in ('todo','doing','blocked','done')),
  priority text not null default 'normal' check(priority in ('low','normal','high')),
  due_date date,
  assignee_label text not null default '' check(length(assignee_label)<=120),
  actor_name text not null check(length(btrim(actor_name)) between 2 and 120),
  version integer not null default 1 check(version>=1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists admin_work_tasks_status_idx on public.admin_work_tasks(task_status, updated_at desc);
create index if not exists admin_work_tasks_due_idx on public.admin_work_tasks(due_date) where due_date is not null;

create table if not exists public.admin_work_task_events (
  id bigint generated always as identity primary key,
  task_id uuid not null references public.admin_work_tasks(id) on delete restrict,
  from_status text,
  to_status text not null,
  action text not null check(action in ('created','updated')),
  actor_name text not null,
  title text not null,
  due_date date,
  recorded_at timestamptz not null default now()
);
create index if not exists admin_work_task_events_task_idx on public.admin_work_task_events(task_id,id desc);

create or replace function public.admin_work_task_guard()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
  if tg_op='INSERT' then
    if new.version<>1 or new.task_status<>'todo' then
      raise exception 'Task must begin todo, version one';
    end if;
  else
    if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
      raise exception 'Task identity and creation time are immutable';
    end if;
    if new.version <> old.version + 1 then
      raise exception 'Task version mismatch';
    end if;
    if old.task_status='done' and new.task_status not in ('done','todo') then
      raise exception 'Completed task must reopen to todo before progressing';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

create or replace function public.admin_work_task_audit()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
  if tg_op='INSERT' then
    insert into public.admin_work_task_events(task_id,from_status,to_status,action,actor_name,title,due_date)
      values(new.id,null,new.task_status,'created',new.actor_name,new.title,new.due_date);
  else
    insert into public.admin_work_task_events(task_id,from_status,to_status,action,actor_name,title,due_date)
      values(new.id,old.task_status,new.task_status,'updated',new.actor_name,new.title,new.due_date);
  end if;
  return new;
end $$;

drop trigger if exists admin_work_task_guard_trigger on public.admin_work_tasks;
create trigger admin_work_task_guard_trigger before insert or update on public.admin_work_tasks
  for each row execute function public.admin_work_task_guard();
drop trigger if exists admin_work_task_audit_trigger on public.admin_work_tasks;
create trigger admin_work_task_audit_trigger after insert or update on public.admin_work_tasks
  for each row execute function public.admin_work_task_audit();

alter table public.admin_work_tasks enable row level security;
alter table public.admin_work_task_events enable row level security;
revoke all on public.admin_work_tasks from public, anon, authenticated;
revoke all on public.admin_work_task_events from public, anon, authenticated;
grant select,insert,update on public.admin_work_tasks to service_role;
grant select,insert on public.admin_work_task_events to service_role;
grant usage,select on sequence public.admin_work_task_events_id_seq to service_role;
revoke all on function public.admin_work_task_guard() from public, anon, authenticated;
revoke all on function public.admin_work_task_audit() from public, anon, authenticated;
