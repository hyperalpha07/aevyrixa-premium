-- Phase 44: Product reviews and moderated testimonials
-- Run manually in the Supabase SQL Editor.

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  product_slug text not null,
  order_id uuid null,
  order_reference text null,
  customer_id uuid null,
  customer_name text not null,
  customer_phone text null,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text null,
  body text not null,
  media_urls jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  source_type text not null default 'order-linked' check (source_type in ('order-linked', 'admin-added', 'imported')),
  verified_purchase boolean not null default false,
  is_featured boolean not null default false,
  admin_note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz null
);

alter table public.product_reviews
  add column if not exists source_type text not null default 'order-linked';

alter table public.product_reviews
  add column if not exists verified_purchase boolean not null default false;

alter table public.product_reviews
  drop constraint if exists product_reviews_source_type_check;

alter table public.product_reviews
  add constraint product_reviews_source_type_check
  check (source_type in ('order-linked', 'admin-added', 'imported'));

alter table public.product_reviews
  drop constraint if exists product_reviews_verified_purchase_safe_check;

alter table public.product_reviews
  add constraint product_reviews_verified_purchase_safe_check
  check (verified_purchase = false or (source_type = 'order-linked' and order_reference is not null));

update public.product_reviews
set verified_purchase = true
where order_reference is not null
  and source_type = 'order-linked';

create index if not exists product_reviews_product_slug_idx
  on public.product_reviews (product_slug);

create index if not exists product_reviews_product_id_idx
  on public.product_reviews (product_id);

create index if not exists product_reviews_status_idx
  on public.product_reviews (status);

create index if not exists product_reviews_rating_idx
  on public.product_reviews (rating);

create index if not exists product_reviews_created_at_desc_idx
  on public.product_reviews (created_at desc);

create index if not exists product_reviews_is_featured_idx
  on public.product_reviews (is_featured);

create unique index if not exists product_reviews_customer_order_product_unique_idx
  on public.product_reviews (
    coalesce(customer_id::text, ''),
    coalesce(order_reference, ''),
    product_id
  )
  where status <> 'rejected';

alter table public.product_reviews enable row level security;

drop policy if exists "product_reviews_service_role_all" on public.product_reviews;
create policy "product_reviews_service_role_all"
  on public.product_reviews
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
