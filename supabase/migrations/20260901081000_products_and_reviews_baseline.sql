-- P0 baseline 2: products and product reviews.

create or replace function public.set_products_updated_at()
returns trigger language plpgsql set search_path to 'pg_catalog', 'public' as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text null,
  description text null,
  category text null default 'Reusable Period Panty',
  price numeric not null default 0,
  compare_at_price numeric null,
  currency text not null default 'USD',
  status text not null default 'draft',
  featured boolean not null default false,
  stock_status text not null default 'in_stock',
  stock_quantity integer null,
  sizes jsonb null default '[]'::jsonb,
  colors jsonb null default '[]'::jsonb,
  absorbency text null,
  absorbency_options jsonb null default '[]'::jsonb,
  visual text null default 'default',
  visual_theme text null,
  visual_variant text null,
  benefits jsonb null default '[]'::jsonb,
  care jsonb null default '[]'::jsonb,
  seo_title text null,
  seo_description text null,
  image_url text null,
  poster_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  deleted_reason text null,
  deleted_by text null,
  video_url text null,
  images jsonb null default '[]'::jsonb,
  media jsonb not null default '[]'::jsonb,
  video_path text null,
  primary_image_url text null,
  primary_image_path text null
);

alter table public.products add column if not exists short_description text null;
alter table public.products add column if not exists description text null;
alter table public.products add column if not exists category text null default 'Reusable Period Panty';
alter table public.products add column if not exists compare_at_price numeric null;
alter table public.products add column if not exists currency text not null default 'USD';
alter table public.products add column if not exists status text not null default 'draft';
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists stock_status text not null default 'in_stock';
alter table public.products add column if not exists stock_quantity integer null;
alter table public.products add column if not exists sizes jsonb null default '[]'::jsonb;
alter table public.products add column if not exists colors jsonb null default '[]'::jsonb;
alter table public.products add column if not exists absorbency text null;
alter table public.products add column if not exists absorbency_options jsonb null default '[]'::jsonb;
alter table public.products add column if not exists visual text null default 'default';
alter table public.products add column if not exists visual_theme text null;
alter table public.products add column if not exists visual_variant text null;
alter table public.products add column if not exists benefits jsonb null default '[]'::jsonb;
alter table public.products add column if not exists care jsonb null default '[]'::jsonb;
alter table public.products add column if not exists seo_title text null;
alter table public.products add column if not exists seo_description text null;
alter table public.products add column if not exists image_url text null;
alter table public.products add column if not exists poster_url text null;
alter table public.products add column if not exists created_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();
alter table public.products add column if not exists deleted_at timestamptz null;
alter table public.products add column if not exists deleted_reason text null;
alter table public.products add column if not exists deleted_by text null;
alter table public.products add column if not exists video_url text null;
alter table public.products add column if not exists images jsonb null default '[]'::jsonb;
alter table public.products add column if not exists media jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists video_path text null;
alter table public.products add column if not exists primary_image_url text null;
alter table public.products add column if not exists primary_image_path text null;

create unique index if not exists products_slug_key on public.products (slug);
create index if not exists products_slug_idx on public.products (slug);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_featured_idx on public.products (featured);
create index if not exists products_deleted_at_idx on public.products (deleted_at);
create index if not exists products_status_deleted_idx on public.products (status, deleted_at);

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid null,
  product_slug text null,
  customer_name text not null default 'Verified customer',
  rating integer not null default 5,
  title text null,
  body text not null default '',
  media_url text null,
  media_type text null,
  is_featured boolean not null default false,
  is_approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'approved',
  media_urls jsonb not null default '[]'::jsonb,
  source_type text not null default 'admin-added',
  verified_purchase boolean not null default false,
  admin_note text null,
  approved_at timestamptz null,
  order_id uuid null,
  order_reference text null,
  customer_id uuid null,
  customer_phone text null
);

alter table public.product_reviews add column if not exists product_id uuid null;
alter table public.product_reviews add column if not exists product_slug text null;
alter table public.product_reviews add column if not exists customer_name text not null default 'Verified customer';
alter table public.product_reviews add column if not exists rating integer not null default 5;
alter table public.product_reviews add column if not exists title text null;
alter table public.product_reviews add column if not exists body text not null default '';
alter table public.product_reviews add column if not exists media_url text null;
alter table public.product_reviews add column if not exists media_type text null;
alter table public.product_reviews add column if not exists is_featured boolean not null default false;
alter table public.product_reviews add column if not exists is_approved boolean not null default true;
alter table public.product_reviews add column if not exists created_at timestamptz not null default now();
alter table public.product_reviews add column if not exists updated_at timestamptz not null default now();
alter table public.product_reviews add column if not exists status text not null default 'approved';
alter table public.product_reviews add column if not exists media_urls jsonb not null default '[]'::jsonb;
alter table public.product_reviews add column if not exists source_type text not null default 'admin-added';
alter table public.product_reviews add column if not exists verified_purchase boolean not null default false;
alter table public.product_reviews add column if not exists admin_note text null;
alter table public.product_reviews add column if not exists approved_at timestamptz null;
alter table public.product_reviews add column if not exists order_id uuid null;
alter table public.product_reviews add column if not exists order_reference text null;
alter table public.product_reviews add column if not exists customer_id uuid null;
alter table public.product_reviews add column if not exists customer_phone text null;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'merchandising') then
    raise exception 'products.merchandising is not part of the production contract';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'id' and udt_name = 'uuid') then
    raise exception 'products.id must be uuid';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'product_reviews' and column_name = 'product_id' and udt_name = 'uuid') then
    raise exception 'product_reviews.product_id must be uuid';
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.products'::regclass and conname = 'products_status_check') then
    alter table public.products add constraint products_status_check check (status in ('active','draft'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.products'::regclass and conname = 'products_stock_status_check') then
    alter table public.products add constraint products_stock_status_check check (stock_status in ('in_stock', 'low_stock', 'out_of_stock', 'preorder'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.product_reviews'::regclass and conname = 'product_reviews_product_id_fkey') then
    alter table public.product_reviews add constraint product_reviews_product_id_fkey foreign key (product_id) references public.products(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.product_reviews'::regclass and conname = 'product_reviews_rating_check') then
    alter table public.product_reviews add constraint product_reviews_rating_check check (rating between 1 and 5);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.product_reviews'::regclass and conname = 'product_reviews_media_type_check') then
    alter table public.product_reviews add constraint product_reviews_media_type_check check (media_type is null or media_type in ('image', 'video'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.product_reviews'::regclass and conname = 'product_reviews_source_type_check') then
    alter table public.product_reviews add constraint product_reviews_source_type_check check (source_type in ('order-linked', 'admin-added', 'imported'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.product_reviews'::regclass and conname = 'product_reviews_verified_purchase_safe_check') then
    alter table public.product_reviews add constraint product_reviews_verified_purchase_safe_check check (verified_purchase = false or (source_type = 'order-linked' and order_reference is not null));
  end if;
end ;

create index if not exists product_reviews_product_id_idx on public.product_reviews (product_id);
create index if not exists product_reviews_product_slug_idx on public.product_reviews (product_slug);
create index if not exists product_reviews_product_slug_status_idx on public.product_reviews (product_slug, status);
create index if not exists product_reviews_status_idx on public.product_reviews (status);
create index if not exists product_reviews_source_type_idx on public.product_reviews (source_type);
create index if not exists product_reviews_is_featured_idx on public.product_reviews (is_featured);
create index if not exists product_reviews_featured_status_idx on public.product_reviews (is_featured, status);
create index if not exists product_reviews_approved_featured_idx on public.product_reviews (is_approved, is_featured);
create index if not exists product_reviews_created_at_desc_idx on public.product_reviews (created_at desc);



drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products for each row execute function public.set_products_updated_at();

alter table public.products enable row level security;
alter table public.product_reviews enable row level security;
revoke all on table public.products from public, anon, authenticated, service_role;
revoke all on table public.product_reviews from public, anon, authenticated, service_role;
grant select, insert, update, delete on table public.products to service_role;
grant select, insert, update, delete on table public.product_reviews to service_role;
drop policy if exists products_service_role_all on public.products;
create policy products_service_role_all on public.products for all to service_role using (true) with check (true);
drop policy if exists product_reviews_service_role_all on public.product_reviews;
create policy product_reviews_service_role_all on public.product_reviews for all to service_role using (true) with check (true);
revoke all on function public.set_products_updated_at() from public, anon, authenticated, service_role;


