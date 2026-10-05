-- P0 baseline 6: support core prerequisites for existing support additive migrations.
-- This establishes only the foundational production support conversation/message contract.
-- Workflow ownership, assignment identity columns, labels, attachments, and shares remain owned by later additive migrations.

create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null default gen_random_uuid(),
  customer_name text null,
  customer_phone text null,
  customer_email text null,
  source_page text null,
  source_url text null,
  subject text null,
  status text not null default 'open',
  assigned_staff text null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_conversations add column if not exists public_token uuid not null default gen_random_uuid();
alter table public.support_conversations add column if not exists customer_name text null;
alter table public.support_conversations add column if not exists customer_phone text null;
alter table public.support_conversations add column if not exists customer_email text null;
alter table public.support_conversations add column if not exists source_page text null;
alter table public.support_conversations add column if not exists source_url text null;
alter table public.support_conversations add column if not exists subject text null;
alter table public.support_conversations add column if not exists status text not null default 'open';
alter table public.support_conversations add column if not exists assigned_staff text null;
alter table public.support_conversations add column if not exists last_message_at timestamptz not null default now();
alter table public.support_conversations add column if not exists created_at timestamptz not null default now();
alter table public.support_conversations add column if not exists updated_at timestamptz not null default now();
create index if not exists support_conversations_status_idx on public.support_conversations (status);
create index if not exists support_conversations_last_message_at_idx on public.support_conversations (last_message_at desc);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender_type text not null,
  sender_name text null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  body text null
);

alter table public.support_messages add column if not exists conversation_id uuid;
alter table public.support_messages add column if not exists sender_type text not null default 'customer';
alter table public.support_messages add column if not exists sender_name text null;
alter table public.support_messages add column if not exists message text not null default '';
alter table public.support_messages add column if not exists is_read boolean not null default false;
alter table public.support_messages add column if not exists created_at timestamptz not null default now();
alter table public.support_messages add column if not exists body text null;

create or replace function public.resolve_support_message_conversation_id()
returns trigger language plpgsql security definer set search_path to 'pg_catalog', 'public' as $function$
declare
  resolved_id uuid;
begin
  if new.conversation_id is null then
    return new;
  end if;

  select id into resolved_id from public.support_conversations where id = new.conversation_id limit 1;
  if resolved_id is not null then
    return new;
  end if;

  select id into resolved_id from public.support_conversations where public_token = new.conversation_id limit 1;
  if resolved_id is not null then
    new.conversation_id := resolved_id;
  end if;

  return new;
end;
$function$;

create or replace function public.sync_support_message_body_message()
returns trigger language plpgsql set search_path to 'pg_catalog', 'public' as $function$
begin
  if (new.message is null or new.message = '') and new.body is not null then
    new.message := new.body;
  end if;
  if (new.body is null or new.body = '') and new.message is not null then
    new.body := new.message;
  end if;
  return new;
end;
$function$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'support_conversations'
      and column_name in ('assigned_staff_id', 'assigned_staff_name')
      and data_type <> 'text'
  ) then
    raise exception 'support_conversations later-owned assignment columns must be text when already present';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'support_conversations'
      and column_name = 'public_token'
      and udt_name <> 'uuid'
  ) then
    raise exception 'support_conversations.public_token must be uuid';
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.support_messages'::regclass and conname = 'support_messages_conversation_id_fkey') then
    alter table public.support_messages add constraint support_messages_conversation_id_fkey foreign key (conversation_id) references public.support_conversations(id) on delete cascade;
  end if;
  if exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.support_messages'::regclass
      and c.conname = 'support_messages_conversation_id_fkey'
      and c.confdeltype <> 'c'
  ) then
    raise exception 'support_messages.conversation_id must cascade on support_conversations delete';
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.support_messages'::regclass and conname = 'support_messages_sender_type_check') then
    alter table public.support_messages add constraint support_messages_sender_type_check check (sender_type in ('customer', 'admin', 'staff', 'system'));
  end if;
end $$;

create index if not exists support_messages_conversation_id_created_at_idx on public.support_messages (conversation_id, created_at);
create unique index if not exists support_messages_id_conversation_id_idx on public.support_messages (id, conversation_id);

drop trigger if exists support_messages_resolve_conversation_id on public.support_messages;
create trigger support_messages_resolve_conversation_id before insert on public.support_messages for each row execute function public.resolve_support_message_conversation_id();
drop trigger if exists support_messages_sync_body_message on public.support_messages;
create trigger support_messages_sync_body_message before insert or update on public.support_messages for each row execute function public.sync_support_message_body_message();

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
revoke all on table public.support_conversations from public, anon, authenticated, service_role;
revoke all on table public.support_messages from public, anon, authenticated, service_role;
grant select, insert, update on table public.support_conversations to service_role;
grant select, insert, update, delete on table public.support_messages to service_role;
drop policy if exists support_conversations_service_role_all on public.support_conversations;
create policy support_conversations_service_role_all on public.support_conversations for all to service_role using (true) with check (true);
drop policy if exists support_messages_service_role_all on public.support_messages;
create policy support_messages_service_role_all on public.support_messages for all to service_role using (true) with check (true);
revoke all on function public.resolve_support_message_conversation_id() from public, anon, authenticated, service_role;
revoke all on function public.sync_support_message_body_message() from public, anon, authenticated, service_role;

