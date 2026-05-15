# Product Backend Setup

Aevyrixa Phase 15 uses `app/lib/product-store.ts` as the product storage adapter.
The storefront and admin product API can read from Supabase when this table
exists, and they fall back to the checked-in static catalog when the table or
environment is not ready.

Do not run this SQL automatically from the app. Apply it manually in Supabase
SQL editor after reviewing the project environment.

```sql
create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text,
  description text,
  category text,
  price numeric(10, 2) not null default 0,
  compare_at_price numeric(10, 2),
  currency text not null default 'USD',
  status text not null default 'draft'
    check (status in ('active', 'draft')),
  featured boolean not null default false,
  stock_status text not null default 'in_stock'
    check (stock_status in ('in_stock', 'low_stock', 'out_of_stock', 'preorder')),
  stock_quantity integer,
  sizes jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  visual text,
  visual_theme text,
  visual_variant text,
  absorbency text,
  absorbency_options jsonb not null default '[]'::jsonb,
  image_url text,
  video_url text,
  poster_url text,
  benefits jsonb not null default '[]'::jsonb,
  care jsonb not null default '[]'::jsonb,
  seo_title text,
  seo_description text,
  deleted_at timestamptz,
  deleted_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_status_idx on public.products (status);
create index if not exists products_featured_idx on public.products (featured);
create index if not exists products_deleted_at_idx on public.products (deleted_at);
```

If the table already exists from Phase 15, add the trash columns manually:

```sql
alter table public.products
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_reason text;

create index if not exists products_deleted_at_idx on public.products (deleted_at);
```

Optional updated-at trigger:

```sql
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_products_updated_at on public.products;

create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();
```

Required environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Security notes:

- `SUPABASE_SERVICE_ROLE_KEY` must only exist in server environments. Never add it
  to client components or expose it with a `NEXT_PUBLIC_` prefix.
- Current Phase 15 product API routes are server routes used by the existing
  admin control room. Add real admin authentication before opening product
  mutation endpoints beyond the current private operating workflow.
- Storefront reads only active products. Draft products stay available to admin
  views and hidden from customers.
- Deleted products use `deleted_at` and `deleted_reason`. They are hidden from
  storefront, hidden from the normal admin list, and only visible in the Deleted
  admin filter.

Product deletion lifecycle:

- Draft is not delete. Draft keeps a product hidden from storefront while it
  remains editable in admin.
- Delete is a soft delete. The API sets `deleted_at = now()` and
  `deleted_reason = 'Deleted from admin'`.
- Restore clears the trash fields and sets `status = 'draft'` so a restored
  product does not immediately go live.
- Permanently Delete is allowed only after a product is already in Deleted.
  This removes the row from `public.products`. Existing order history is safe
  because orders store item snapshot data.

30-day purge foundation:

- Products with `deleted_at < now() - interval '30 days'` are eligible for
  permanent purge.
- `app/lib/product-store.ts` includes `purgeDeletedProductsOlderThan(30)` for a
  future protected admin route, scheduled job, or maintenance script.
- Do not expose a public purge endpoint until real admin authentication protects
  product mutation routes.
- A future Supabase scheduled function or `pg_cron` job can run:

```sql
delete from public.products
where deleted_at is not null
  and deleted_at < now() - interval '30 days';
```

Fallback behavior:

- If Supabase env vars are missing, products use demo memory/static fallback.
- If env vars exist but the `products` table is missing, the adapter catches the
  Supabase error and returns the current static catalog so builds and storefront
  pages continue to work.
- Admin edits are not treated as successful until the product API returns a
  saved backend product. If Supabase is configured but the `products` table is
  missing or rejects the write, admin shows an error instead of saving a local
  product that will disappear after refresh.
