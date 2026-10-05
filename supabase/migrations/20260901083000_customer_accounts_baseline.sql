-- P0 baseline 4: active customer account system plus legacy customers compatibility table.
-- No customer data is inserted, rewritten, or deleted.

create table if not exists public.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text null,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz null
);

alter table public.customer_accounts add column if not exists full_name text not null default '';
alter table public.customer_accounts add column if not exists phone text not null default '';
alter table public.customer_accounts add column if not exists email text null;
alter table public.customer_accounts add column if not exists password_hash text not null default '';
alter table public.customer_accounts add column if not exists is_active boolean not null default true;
alter table public.customer_accounts add column if not exists created_at timestamptz not null default now();
alter table public.customer_accounts add column if not exists updated_at timestamptz not null default now();
alter table public.customer_accounts add column if not exists last_login_at timestamptz null;


create unique index if not exists customer_accounts_email_unique on public.customer_accounts (email) where email is not null and email <> '';

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customer_accounts(id) on delete cascade,
  label text not null default 'Home',
  full_name text not null default '',
  phone text not null default '',
  city_area text not null default '',
  address text not null default '',
  delivery_zone text null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_addresses add column if not exists customer_id uuid;
alter table public.customer_addresses add column if not exists label text not null default 'Home';
alter table public.customer_addresses add column if not exists full_name text not null default '';
alter table public.customer_addresses add column if not exists phone text not null default '';
alter table public.customer_addresses add column if not exists city_area text not null default '';
alter table public.customer_addresses add column if not exists address text not null default '';
alter table public.customer_addresses add column if not exists delivery_zone text null;
alter table public.customer_addresses add column if not exists is_default boolean not null default false;
alter table public.customer_addresses add column if not exists created_at timestamptz not null default now();
alter table public.customer_addresses add column if not exists updated_at timestamptz not null default now();

create table if not exists public.customer_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customer_accounts(id) on delete cascade,
  token_hash text not null,
  user_agent text null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.customer_sessions add column if not exists customer_id uuid;
alter table public.customer_sessions add column if not exists token_hash text not null default '';
alter table public.customer_sessions add column if not exists user_agent text null;
alter table public.customer_sessions add column if not exists expires_at timestamptz not null default now();
alter table public.customer_sessions add column if not exists created_at timestamptz not null default now();

create index if not exists customer_sessions_token_hash_idx on public.customer_sessions (token_hash);

create table if not exists public.customer_activity_logs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid null references public.customer_accounts(id) on delete cascade,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.customer_activity_logs add column if not exists customer_id uuid null;
alter table public.customer_activity_logs add column if not exists action text not null default 'unknown';
alter table public.customer_activity_logs add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.customer_activity_logs add column if not exists created_at timestamptz not null default now();

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text null,
  password_hash text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers add column if not exists full_name text not null default '';
alter table public.customers add column if not exists phone text not null default '';
alter table public.customers add column if not exists email text null;
alter table public.customers add column if not exists password_hash text not null default '';
alter table public.customers add column if not exists status text not null default 'active';
alter table public.customers add column if not exists created_at timestamptz not null default now();
alter table public.customers add column if not exists updated_at timestamptz not null default now();



do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.customer_accounts'::regclass and conname = 'customer_accounts_phone_key') then
    alter table public.customer_accounts add constraint customer_accounts_phone_key unique (phone);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.customer_sessions'::regclass and conname = 'customer_sessions_token_hash_key') then
    alter table public.customer_sessions add constraint customer_sessions_token_hash_key unique (token_hash);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.customers'::regclass and conname = 'customers_phone_key') then
    alter table public.customers add constraint customers_phone_key unique (phone);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.customers'::regclass and conname = 'customers_email_key') then
    alter table public.customers add constraint customers_email_key unique (email);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.customer_addresses'::regclass and conname = 'customer_addresses_customer_id_fkey') then
    alter table public.customer_addresses add constraint customer_addresses_customer_id_fkey foreign key (customer_id) references public.customer_accounts(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.customer_sessions'::regclass and conname = 'customer_sessions_customer_id_fkey') then
    alter table public.customer_sessions add constraint customer_sessions_customer_id_fkey foreign key (customer_id) references public.customer_accounts(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.customer_activity_logs'::regclass and conname = 'customer_activity_logs_customer_id_fkey') then
    alter table public.customer_activity_logs add constraint customer_activity_logs_customer_id_fkey foreign key (customer_id) references public.customer_accounts(id) on delete cascade;
  end if;

  if exists (select 1 from pg_proc where pronamespace = 'public'::regnamespace and proname = 'set_customer_accounts_updated_at') then
    raise exception 'set_customer_accounts_updated_at is not part of the production customer baseline contract';
  end if;

  if exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.customer_activity_logs'::regclass
      and c.conname = 'customer_activity_logs_customer_id_fkey'
      and c.confdeltype <> 'c'
  ) then
    raise exception 'customer_activity_logs.customer_id must cascade on customer_accounts delete';
  end if;
end $$;

create index if not exists customer_addresses_customer_id_idx on public.customer_addresses (customer_id);
create index if not exists customer_sessions_customer_id_idx on public.customer_sessions (customer_id);
create index if not exists customer_activity_logs_customer_id_idx on public.customer_activity_logs (customer_id);

alter table public.customer_accounts enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.customer_sessions enable row level security;
alter table public.customer_activity_logs enable row level security;
alter table public.customers enable row level security;
revoke all on table public.customer_accounts from public, anon, authenticated, service_role;
revoke all on table public.customer_addresses from public, anon, authenticated, service_role;
revoke all on table public.customer_sessions from public, anon, authenticated, service_role;
revoke all on table public.customer_activity_logs from public, anon, authenticated, service_role;
revoke all on table public.customers from public, anon, authenticated, service_role;
grant select, insert, update on table public.customer_accounts to service_role;
grant select, insert, update, delete on table public.customer_addresses to service_role;
grant select, insert, delete on table public.customer_sessions to service_role;
grant insert on table public.customer_activity_logs to service_role;
drop policy if exists customer_accounts_service_role_all on public.customer_accounts;
create policy customer_accounts_service_role_all on public.customer_accounts for all to service_role using (true) with check (true);
drop policy if exists customer_addresses_service_role_all on public.customer_addresses;
create policy customer_addresses_service_role_all on public.customer_addresses for all to service_role using (true) with check (true);
drop policy if exists customer_sessions_service_role_all on public.customer_sessions;
create policy customer_sessions_service_role_all on public.customer_sessions for all to service_role using (true) with check (true);
drop policy if exists customer_activity_logs_service_role_all on public.customer_activity_logs;
create policy customer_activity_logs_service_role_all on public.customer_activity_logs for all to service_role using (true) with check (true);
