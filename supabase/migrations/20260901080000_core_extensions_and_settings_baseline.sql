-- P0 baseline 1: core extensions and store settings.
-- Historical baseline for fresh database reproducibility. Safe on production-shaped DBs.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

create table if not exists public.store_settings (
  id text primary key default 'main',
  store_name text null default 'Aevyrixa Her Care',
  support_phone text null,
  support_whatsapp text null,
  support_email text null,
  facebook_page_url text null,
  instagram_url text null,
  tiktok_url text null,
  business_location text null,
  delivery_coverage_text text null,
  cod_message text null,
  privacy_packaging_message text null,
  support_window_message text null,
  hygiene_return_message text null,
  order_confirmation_message text null,
  updated_at timestamptz not null default now(),
  store_profile jsonb null default '{}'::jsonb,
  payment_settings jsonb null default '{}'::jsonb,
  checkout_settings jsonb null default '{}'::jsonb,
  delivery_settings jsonb null default '{}'::jsonb,
  policy_settings jsonb null default '{}'::jsonb,
  order_settings jsonb null default '{}'::jsonb,
  notification_settings jsonb null default '{}'::jsonb,
  seo_settings jsonb null default '{}'::jsonb,
  appearance_settings jsonb null default '{}'::jsonb,
  advanced_settings jsonb null default '{}'::jsonb,
  homepage_media_settings jsonb not null default '{}'::jsonb
);

alter table public.store_settings add column if not exists store_name text null default 'Aevyrixa Her Care';
alter table public.store_settings add column if not exists support_phone text null;
alter table public.store_settings add column if not exists support_whatsapp text null;
alter table public.store_settings add column if not exists support_email text null;
alter table public.store_settings add column if not exists facebook_page_url text null;
alter table public.store_settings add column if not exists instagram_url text null;
alter table public.store_settings add column if not exists tiktok_url text null;
alter table public.store_settings add column if not exists business_location text null;
alter table public.store_settings add column if not exists delivery_coverage_text text null;
alter table public.store_settings add column if not exists cod_message text null;
alter table public.store_settings add column if not exists privacy_packaging_message text null;
alter table public.store_settings add column if not exists support_window_message text null;
alter table public.store_settings add column if not exists hygiene_return_message text null;
alter table public.store_settings add column if not exists order_confirmation_message text null;
alter table public.store_settings add column if not exists updated_at timestamptz not null default now();
alter table public.store_settings add column if not exists store_profile jsonb null default '{}'::jsonb;
alter table public.store_settings add column if not exists payment_settings jsonb null default '{}'::jsonb;
alter table public.store_settings add column if not exists checkout_settings jsonb null default '{}'::jsonb;
alter table public.store_settings add column if not exists delivery_settings jsonb null default '{}'::jsonb;
alter table public.store_settings add column if not exists policy_settings jsonb null default '{}'::jsonb;
alter table public.store_settings add column if not exists order_settings jsonb null default '{}'::jsonb;
alter table public.store_settings add column if not exists notification_settings jsonb null default '{}'::jsonb;
alter table public.store_settings add column if not exists seo_settings jsonb null default '{}'::jsonb;
alter table public.store_settings add column if not exists appearance_settings jsonb null default '{}'::jsonb;
alter table public.store_settings add column if not exists advanced_settings jsonb null default '{}'::jsonb;
alter table public.store_settings add column if not exists homepage_media_settings jsonb not null default '{}'::jsonb;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'store_settings' and column_name = 'created_at') then
    raise exception 'store_settings.created_at is not part of the production contract';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'store_settings' and column_name = 'id'
      and data_type = 'text' and is_nullable = 'NO' and column_default = '''main''::text'
  ) then
    raise exception 'store_settings.id must be text not null default main';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'store_settings' and column_name = 'homepage_media_settings'
      and data_type = 'jsonb' and is_nullable = 'NO'
  ) then
    raise exception 'store_settings.homepage_media_settings must be jsonb not null';
  end if;
end $$;

alter table public.store_settings enable row level security;
revoke all on table public.store_settings from public, anon, authenticated, service_role;
grant select, insert, update on table public.store_settings to service_role;
drop policy if exists store_settings_service_role_all on public.store_settings;
create policy store_settings_service_role_all on public.store_settings for all to service_role using (true) with check (true);
