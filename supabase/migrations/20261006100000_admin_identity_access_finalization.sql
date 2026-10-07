-- Admin V2 identity/access finalization.
-- Additive only: preserves existing admin_staff rows, password hashes, activity
-- logs, and effective permissions. Does not create an owner staff row, does not
-- enable MFA automatically, and does not fabricate historical sessions.

alter table public.admin_staff
  add column if not exists permission_overrides jsonb not null default '{}'::jsonb;

create table if not exists public.admin_roles (
  key text primary key,
  name text not null,
  description text null,
  permissions jsonb not null default '{}'::jsonb,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_roles_key_valid check (key ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint admin_roles_key_not_owner check (key <> 'owner'),
  constraint admin_roles_name_not_blank check (length(btrim(name)) between 1 and 120)
);

create unique index if not exists admin_roles_name_ci_idx
  on public.admin_roles (lower(name));

insert into public.admin_roles (key, name, description, permissions, is_system, is_active)
values
  ('manager', 'Manager', 'System manager role template.', jsonb_build_object(
    'dashboard.view', true, 'orders.view', true, 'orders.editStatus', true, 'orders.editCourier', true,
    'orders.viewInvoice', true, 'orders.issueInvoice', true, 'orders.addNote', true, 'orders.archiveTest', true,
    'orders.export', true, 'products.view', true, 'products.edit', true, 'products.media', true,
    'products.merchandising', true, 'reviews.view', true, 'reviews.manage', true, 'reviews.moderate', true,
    'reviews.feature', true, 'categories.manage', true, 'settings.view', true, 'settings.editBasic', true,
    'settings.manage', true, 'announcement.manage', true, 'footer.manage', true, 'homepage.manage', true,
    'support.view', true, 'support.reply', true, 'support.close', true, 'support.manage', true,
    'analytics.view', true, 'activity.view', true
  ), true, true),
  ('order_staff', 'Order Staff', 'System order operations role template.', jsonb_build_object(
    'dashboard.view', true, 'orders.view', true, 'orders.editStatus', true, 'orders.editCourier', true,
    'orders.viewInvoice', true, 'orders.issueInvoice', true, 'orders.addNote', true, 'orders.export', true
  ), true, true),
  ('product_staff', 'Product Staff', 'System product operations role template.', jsonb_build_object(
    'dashboard.view', true, 'products.view', true, 'products.edit', true, 'products.media', true,
    'products.merchandising', true, 'reviews.view', true, 'reviews.manage', true, 'reviews.moderate', true,
    'reviews.feature', true, 'categories.manage', true
  ), true, true),
  ('support_staff', 'Support Staff', 'System support operations role template.', jsonb_build_object(
    'dashboard.view', true, 'support.view', true, 'support.reply', true, 'support.close', true, 'support.manage', true
  ), true, true),
  ('viewer', 'Viewer', 'System read-mostly role template.', jsonb_build_object(
    'dashboard.view', true, 'orders.view', true, 'orders.viewInvoice', true, 'products.view', true,
    'reviews.view', true, 'settings.view', true, 'support.view', true, 'customers.view', true
  ), true, true)
on conflict (key) do nothing;

create table if not exists public.admin_staff_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role_key text not null references public.admin_roles(key) on update cascade on delete restrict,
  permission_overrides jsonb not null default '{}'::jsonb,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz null,
  revoked_at timestamptz null,
  created_by text null,
  created_at timestamptz not null default now(),
  constraint admin_staff_invites_email_not_blank check (length(btrim(email)) between 3 and 254)
);

create index if not exists admin_staff_invites_email_idx on public.admin_staff_invites(lower(email));
create index if not exists admin_staff_invites_active_idx on public.admin_staff_invites(expires_at)
  where accepted_at is null and revoked_at is null;

create table if not exists public.admin_password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.admin_staff(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz null,
  revoked_at timestamptz null,
  created_by text null,
  created_at timestamptz not null default now()
);

create index if not exists admin_password_reset_tokens_staff_idx on public.admin_password_reset_tokens(staff_id, expires_at desc);

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  principal_type text not null check (principal_type in ('owner', 'staff')),
  staff_id uuid null references public.admin_staff(id) on delete cascade,
  username text not null,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  revoke_reason text null,
  user_agent_hash text null,
  constraint admin_sessions_staff_required check (
    (principal_type = 'owner' and staff_id is null) or
    (principal_type = 'staff' and staff_id is not null)
  )
);

create index if not exists admin_sessions_staff_idx on public.admin_sessions(staff_id, expires_at desc);
create index if not exists admin_sessions_active_idx on public.admin_sessions(expires_at)
  where revoked_at is null;

create table if not exists public.admin_mfa_credentials (
  id uuid primary key default gen_random_uuid(),
  principal_type text not null check (principal_type in ('owner', 'staff')),
  principal_id text not null,
  secret_encrypted text not null,
  enabled_at timestamptz null,
  recovery_codes_hashes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (principal_type, principal_id)
);

create table if not exists public.admin_login_throttle (
  key_hash text primary key,
  purpose text not null check (purpose in ('login', 'mfa')),
  attempts integer not null default 0 check (attempts >= 0),
  locked_until timestamptz null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_mfa_challenges (
  id uuid primary key default gen_random_uuid(),
  principal_type text not null check (principal_type in ('owner', 'staff')),
  principal_id text not null,
  username text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  revoked_at timestamptz null,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now()
);

create index if not exists admin_mfa_challenges_active_idx on public.admin_mfa_challenges(expires_at)
  where consumed_at is null and revoked_at is null;

alter table public.admin_roles enable row level security;
alter table public.admin_staff_invites enable row level security;
alter table public.admin_password_reset_tokens enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.admin_mfa_credentials enable row level security;
alter table public.admin_login_throttle enable row level security;
alter table public.admin_mfa_challenges enable row level security;

revoke all on table public.admin_roles from public, anon, authenticated, service_role;
revoke all on table public.admin_staff_invites from public, anon, authenticated, service_role;
revoke all on table public.admin_password_reset_tokens from public, anon, authenticated, service_role;
revoke all on table public.admin_sessions from public, anon, authenticated, service_role;
revoke all on table public.admin_mfa_credentials from public, anon, authenticated, service_role;
revoke all on table public.admin_login_throttle from public, anon, authenticated, service_role;
revoke all on table public.admin_mfa_challenges from public, anon, authenticated, service_role;

grant select, insert, update, delete on table public.admin_roles to service_role;
grant select, insert, update on table public.admin_staff_invites to service_role;
grant select, insert, update on table public.admin_password_reset_tokens to service_role;
grant select, insert, update on table public.admin_sessions to service_role;
grant select, insert, update on table public.admin_mfa_credentials to service_role;
grant select, insert, update, delete on table public.admin_login_throttle to service_role;
grant select, insert, update on table public.admin_mfa_challenges to service_role;

drop policy if exists admin_roles_service_role_all on public.admin_roles;
create policy admin_roles_service_role_all on public.admin_roles for all to service_role using (true) with check (true);

drop policy if exists admin_staff_invites_service_role_all on public.admin_staff_invites;
create policy admin_staff_invites_service_role_all on public.admin_staff_invites for all to service_role using (true) with check (true);

drop policy if exists admin_password_reset_tokens_service_role_all on public.admin_password_reset_tokens;
create policy admin_password_reset_tokens_service_role_all on public.admin_password_reset_tokens for all to service_role using (true) with check (true);

drop policy if exists admin_sessions_service_role_all on public.admin_sessions;
create policy admin_sessions_service_role_all on public.admin_sessions for all to service_role using (true) with check (true);

drop policy if exists admin_mfa_credentials_service_role_all on public.admin_mfa_credentials;
create policy admin_mfa_credentials_service_role_all on public.admin_mfa_credentials for all to service_role using (true) with check (true);

drop policy if exists admin_login_throttle_service_role_all on public.admin_login_throttle;
create policy admin_login_throttle_service_role_all on public.admin_login_throttle for all to service_role using (true) with check (true);

drop policy if exists admin_mfa_challenges_service_role_all on public.admin_mfa_challenges;
create policy admin_mfa_challenges_service_role_all on public.admin_mfa_challenges for all to service_role using (true) with check (true);
