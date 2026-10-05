-- Admin V2 Support finalization: priority/SLA/escalation fields and completed
-- least-privilege support management access. Source-only migration; do not use
-- as a business-data repair/backfill script.

alter table public.support_conversations
  add column if not exists priority text not null default 'normal',
  add column if not exists sla_started_at timestamptz null,
  add column if not exists escalated_at timestamptz null,
  add column if not exists escalated_by text null,
  add column if not exists escalation_reason text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.support_conversations'::regclass
      and conname = 'support_conversations_priority_valid'
  ) then
    alter table public.support_conversations
      add constraint support_conversations_priority_valid
      check (priority in ('low', 'normal', 'high', 'urgent'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.support_conversations'::regclass
      and conname = 'support_conversations_escalation_reason_length'
  ) then
    alter table public.support_conversations
      add constraint support_conversations_escalation_reason_length
      check (escalation_reason is null or length(btrim(escalation_reason)) between 1 and 1000);
  end if;
end $$;

create index if not exists support_conversations_priority_idx
  on public.support_conversations(priority);

create index if not exists support_conversations_sla_started_at_idx
  on public.support_conversations(sla_started_at)
  where sla_started_at is not null;

create index if not exists support_conversations_escalated_open_idx
  on public.support_conversations(escalated_at desc)
  where escalated_at is not null and status <> 'closed';

alter table public.support_conversations enable row level security;
alter table public.support_internal_notes enable row level security;
alter table public.support_conversation_labels enable row level security;
alter table public.support_labels enable row level security;
alter table public.support_saved_replies enable row level security;

revoke all on table public.support_conversations from public, anon, authenticated, service_role;
revoke all on table public.support_internal_notes from public, anon, authenticated, service_role;
revoke all on table public.support_conversation_labels from public, anon, authenticated, service_role;
revoke all on table public.support_labels from public, anon, authenticated, service_role;
revoke all on table public.support_saved_replies from public, anon, authenticated, service_role;

grant select, insert, update on table public.support_conversations to service_role;
grant select, insert on table public.support_internal_notes to service_role;
grant select, insert, delete on table public.support_conversation_labels to service_role;
grant select, insert, update, delete on table public.support_labels to service_role;
grant select, insert, update, delete on table public.support_saved_replies to service_role;

drop policy if exists support_conversations_service_role_all on public.support_conversations;
create policy support_conversations_service_role_all on public.support_conversations for all to service_role using (true) with check (true);

drop policy if exists support_internal_notes_service_role_all on public.support_internal_notes;
create policy support_internal_notes_service_role_all on public.support_internal_notes for all to service_role using (true) with check (true);

drop policy if exists support_conversation_labels_service_role_all on public.support_conversation_labels;
create policy support_conversation_labels_service_role_all on public.support_conversation_labels for all to service_role using (true) with check (true);

drop policy if exists support_labels_service_role_all on public.support_labels;
create policy support_labels_service_role_all on public.support_labels for all to service_role using (true) with check (true);

drop policy if exists support_saved_replies_service_role_all on public.support_saved_replies;
create policy support_saved_replies_service_role_all on public.support_saved_replies for all to service_role using (true) with check (true);
