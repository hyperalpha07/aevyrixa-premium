
-- Admin V2 operational foundations. No existing order, payment, tax or notification writes.
-- New automation rules are DISABLED by default; only explicitly initiated internal
-- staff-task creation is supported. No outbound messages, payments or webhooks.

create table if not exists public.admin_automation_rules (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(btrim(name)) between 3 and 120),
 is_enabled boolean not null default false,
 schedule_mode text not null default 'manual' check(schedule_mode in ('manual','daily')),
 task_title text not null check (length(btrim(task_title)) between 3 and 160),
 task_description text not null default '' check(length(task_description)<=2000),
 task_priority text not null default 'normal' check(task_priority in ('low','normal','high')),
 assignee_label text not null default '' check(length(assignee_label)<=120),
 version integer not null default 1 check(version>=1),
 created_by text not null check(length(created_by) between 1 and 120),
 updated_by text not null check(length(updated_by) between 1 and 120),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.admin_automation_runs (
 id uuid primary key default gen_random_uuid(),
 rule_id uuid not null references public.admin_automation_rules(id) on delete restrict,
 run_day date not null default ((now() at time zone 'UTC')::date),
 run_mode text not null check(run_mode in ('manual','scheduled')),
 work_task_id uuid not null,
 actor text not null check(length(actor) between 1 and 120),
 created_at timestamptz not null default now(),
 unique(rule_id,run_day)
);
create index if not exists admin_automation_runs_created_idx on public.admin_automation_runs(created_at desc);

create table if not exists public.admin_tax_profiles (
 id boolean primary key default true check(id),
 jurisdiction text not null default 'BD' check(jurisdiction='BD'),
 registration_number text not null default '' check(length(registration_number)<=80),
 tax_rate_percent numeric(5,2) not null default 0 check(tax_rate_percent between 0 and 100),
 reporting_notes text not null default '' check(length(reporting_notes)<=3000),
 is_checkout_tax_active boolean not null default false check(is_checkout_tax_active=false),
 version integer not null default 1 check(version>=1),
 updated_by text not null check(length(updated_by) between 1 and 120),
 updated_at timestamptz not null default now()
);

create table if not exists public.admin_webhook_subscriptions (
 id uuid primary key default gen_random_uuid(),
 label text not null check(length(btrim(label)) between 3 and 120),
 event_type text not null check(event_type in ('order.created','order.updated','refund.recorded','payment.recorded')),
 destination_url text not null check(length(destination_url) between 12 and 300),
 is_enabled boolean not null default false check(is_enabled=false),
 version integer not null default 1 check(version>=1),
 updated_by text not null check(length(updated_by) between 1 and 120),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 archived_at timestamptz
);
create index if not exists admin_webhook_subscriptions_active_idx
 on public.admin_webhook_subscriptions(updated_at desc) where archived_at is null;

alter table public.admin_automation_rules enable row level security;
alter table public.admin_automation_runs enable row level security;
alter table public.admin_tax_profiles enable row level security;
alter table public.admin_webhook_subscriptions enable row level security;

revoke all on public.admin_automation_rules,public.admin_automation_runs,public.admin_tax_profiles,public.admin_webhook_subscriptions from public,anon,authenticated;
grant select,insert,update on public.admin_automation_rules to service_role;
grant select,insert on public.admin_automation_runs to service_role;
grant select,insert,update on public.admin_tax_profiles to service_role;
grant select,insert,update on public.admin_webhook_subscriptions to service_role;
revoke delete on public.admin_automation_rules,public.admin_automation_runs,public.admin_tax_profiles,public.admin_webhook_subscriptions from service_role;

-- Exactly one internal task per enabled rule per UTC day. Row lock serializes races;
-- the task and the execution log are inserted in the SAME transaction. No external I/O.
create or replace function public.admin_v2_run_internal_automation(
  p_rule_id uuid, p_actor text, p_mode text default 'manual'
) returns table(run_id uuid, work_task_id uuid, reused boolean)
language plpgsql security invoker set search_path to 'pg_catalog','public' as $$
declare
 v_rule public.admin_automation_rules%rowtype;
 v_existing public.admin_automation_runs%rowtype;
 v_task_id uuid;
 v_run_id uuid;
 v_day date := (now() at time zone 'UTC')::date;
begin
 if p_actor is null or length(btrim(p_actor)) not between 1 and 120
  or p_mode not in ('manual','scheduled') then
  raise exception 'Invalid automation execution request.' using errcode='22023';
 end if;
 select * into v_rule from public.admin_automation_rules
 where id=p_rule_id for update;
 if not found then raise exception 'Automation rule not found.' using errcode='22023'; end if;
 if not v_rule.is_enabled then raise exception 'Automation rule is disabled.' using errcode='22023'; end if;
 if p_mode='scheduled' and v_rule.schedule_mode <> 'daily' then
   raise exception 'Rule is not configured for scheduled execution.' using errcode='22023';
 end if;
 select * into v_existing from public.admin_automation_runs
 where rule_id=p_rule_id and run_day=v_day;
 if found then
   return query select v_existing.id, v_existing.work_task_id, true;
   return;
 end if;
 insert into public.admin_work_tasks
  (title,description,task_status,priority,due_date,assignee_label,actor_name)
 values
  (v_rule.task_title,v_rule.task_description,'todo',v_rule.task_priority,v_day,
   v_rule.assignee_label,p_actor)
 returning id into v_task_id;
 insert into public.admin_automation_runs(rule_id,run_day,run_mode,work_task_id,actor)
 values(p_rule_id,v_day,p_mode,v_task_id,p_actor) returning id into v_run_id;
 return query select v_run_id,v_task_id,false;
end $$;
revoke all on function public.admin_v2_run_internal_automation(uuid,text,text) from public,anon,authenticated;
grant execute on function public.admin_v2_run_internal_automation(uuid,text,text) to service_role;

-- NO cron job is scheduled, and no external provider, webhook HTTP request, tax
-- checkout calculation, fiscal submission or customer message is created here.
