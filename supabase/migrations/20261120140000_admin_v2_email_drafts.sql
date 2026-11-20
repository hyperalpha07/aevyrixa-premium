-- Native Admin V2 Email draft persistence only. No email delivery or provider credentials.
-- Additive, service-role-only; validate on isolated staging before any production rollout.
create table if not exists public.admin_email_drafts (
  id uuid primary key default gen_random_uuid(),
  to_address text not null default '' check (length(to_address) <= 254),
  subject text not null default '' check (length(subject) <= 200),
  body_text text not null default '' check (length(body_text) <= 20000),
  revision integer not null default 1 check (revision >= 1),
  created_by text not null check (length(created_by) between 1 and 120),
  updated_by text not null check (length(updated_by) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint admin_email_drafts_recipient_format check (
    to_address = '' or to_address ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}$'
  )
);
create index if not exists admin_email_drafts_active_updated_idx
  on public.admin_email_drafts (updated_at desc) where archived_at is null;

alter table public.admin_email_drafts enable row level security;
revoke all on table public.admin_email_drafts from public, anon, authenticated;
grant select, insert, update on table public.admin_email_drafts to service_role;

-- No send operation, outbound queue, delivery log or automatic recipient contact is created.
