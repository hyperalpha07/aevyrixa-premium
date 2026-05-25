-- Phase 45 product CMS media and color options
--
-- No destructive migration is required when the existing products.media jsonb
-- column is present. The admin stores extended product content in media as a
-- `{ "kind": "product_cms", "version": 1, ... }` entry.
--
-- Run this only if an older products table is missing the media column.

alter table public.products
  add column if not exists media jsonb not null default '[]'::jsonb;

comment on column public.products.media is
  'Product gallery/CMS extension JSON. Phase 45 stores product_cms section media, content blocks, color options, benefit items, FAQ items, and subtle visual theme settings here.';
