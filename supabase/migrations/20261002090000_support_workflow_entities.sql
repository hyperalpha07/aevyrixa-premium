-- Support workflow entities for Admin V2 Support.
-- Review before applying. This migration is additive only.

alter table public.support_conversations
  add column if not exists assigned_staff_id text null,
  add column if not exists assigned_staff_name text null;

create table if not exists public.support_message_product_shares (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.support_messages(id) on delete cascade,
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  product_id text null,
  product_slug text not null,
  title text not null,
  image_url text null,
  price numeric null,
  currency text null,
  stock_status text null,
  created_at timestamptz not null default now()
);

create index if not exists support_message_product_shares_message_id_idx
  on public.support_message_product_shares (message_id);

create index if not exists support_message_product_shares_conversation_id_idx
  on public.support_message_product_shares (conversation_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'support_message_product_shares_message_conversation_fk'
  ) then
    alter table public.support_message_product_shares
      add constraint support_message_product_shares_message_conversation_fk
      foreign key (message_id, conversation_id)
      references public.support_messages(id, conversation_id)
      on delete cascade
      not valid;
  end if;
end $$;

create table if not exists public.support_message_order_shares (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.support_messages(id) on delete cascade,
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  order_reference text not null,
  order_date timestamptz null,
  amount numeric null,
  currency text null,
  status text null,
  created_at timestamptz not null default now()
);

create index if not exists support_message_order_shares_message_id_idx
  on public.support_message_order_shares (message_id);

create index if not exists support_message_order_shares_conversation_id_idx
  on public.support_message_order_shares (conversation_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'support_message_order_shares_message_conversation_fk'
  ) then
    alter table public.support_message_order_shares
      add constraint support_message_order_shares_message_conversation_fk
      foreign key (message_id, conversation_id)
      references public.support_messages(id, conversation_id)
      on delete cascade
      not valid;
  end if;
end $$;

create table if not exists public.support_internal_notes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  body text not null,
  author_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_internal_notes_conversation_id_idx
  on public.support_internal_notes (conversation_id, created_at);

create table if not exists public.support_labels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text null,
  created_at timestamptz not null default now(),
  unique (name)
);

create table if not exists public.support_conversation_labels (
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  label_id uuid not null references public.support_labels(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, label_id)
);

create table if not exists public.support_saved_replies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by text null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'support_internal_notes_body_not_blank'
  ) then
    alter table public.support_internal_notes
      add constraint support_internal_notes_body_not_blank
      check (length(btrim(body)) > 0)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'support_labels_name_not_blank'
  ) then
    alter table public.support_labels
      add constraint support_labels_name_not_blank
      check (length(btrim(name)) > 0)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'support_saved_replies_title_not_blank'
  ) then
    alter table public.support_saved_replies
      add constraint support_saved_replies_title_not_blank
      check (length(btrim(title)) > 0)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'support_saved_replies_body_not_blank'
  ) then
    alter table public.support_saved_replies
      add constraint support_saved_replies_body_not_blank
      check (length(btrim(body)) > 0)
      not valid;
  end if;
end $$;

alter table public.support_message_product_shares enable row level security;
alter table public.support_message_order_shares enable row level security;
alter table public.support_internal_notes enable row level security;
alter table public.support_labels enable row level security;
alter table public.support_conversation_labels enable row level security;
alter table public.support_saved_replies enable row level security;

-- The app reads/writes these support workflow entities through server-side service-role routes only.
-- No anon/authenticated table policies are added here.
