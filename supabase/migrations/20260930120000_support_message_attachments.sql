-- Support message attachments metadata and private storage bucket.
-- Review before applying. This migration is additive and does not modify existing support tables.

create table if not exists public.support_message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.support_messages(id) on delete cascade,
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists support_message_attachments_message_id_idx
  on public.support_message_attachments (message_id);

create index if not exists support_message_attachments_conversation_id_idx
  on public.support_message_attachments (conversation_id);

create unique index if not exists support_message_attachments_storage_path_idx
  on public.support_message_attachments (storage_path);

create unique index if not exists support_messages_id_conversation_id_idx
  on public.support_messages (id, conversation_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'support_message_attachments_size_check'
  ) then
    alter table public.support_message_attachments
      add constraint support_message_attachments_size_check
      check (size_bytes > 0 and size_bytes <= 10485760);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'support_message_attachments_mime_type_check'
  ) then
    alter table public.support_message_attachments
      add constraint support_message_attachments_mime_type_check
      check (
        mime_type in (
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'support_message_attachments_message_conversation_fk'
  ) then
    alter table public.support_message_attachments
      add constraint support_message_attachments_message_conversation_fk
      foreign key (message_id, conversation_id)
      references public.support_messages(id, conversation_id)
      on delete cascade;
  end if;
end $$;

alter table public.support_message_attachments enable row level security;

-- The app reads/writes attachments through server-side service-role routes only.
-- No anon/authenticated table policies are added here.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'support-attachments',
  'support-attachments',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
