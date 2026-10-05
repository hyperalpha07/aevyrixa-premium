-- P0 baseline 7: storage bucket metadata only. Does not touch stored objects.
-- Existing buckets are never overwritten here; instead the required contract is verified.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media',
  'product-media',
  true,
  52428800,
  array[
    'image/gif',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'support-attachments',
  'support-attachments',
  false,
  10485760,
  array[
    'application/msword',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do nothing;

do $$
declare
  product_bucket record;
  support_bucket record;
  product_mimes text[] := array[
    'image/gif',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ];
  support_mimes text[] := array[
    'application/msword',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ];
begin
  select * into product_bucket from storage.buckets where id = 'product-media';
  if not found then
    raise exception 'storage bucket product-media is required';
  end if;
  if product_bucket.public is distinct from true then
    raise exception 'product-media bucket must be public';
  end if;
  if product_bucket.file_size_limit is distinct from 52428800 then
    raise exception 'product-media bucket must have 50 MB file_size_limit';
  end if;
  if (select array_agg(v order by v) from unnest(coalesce(product_bucket.allowed_mime_types, '{}'::text[])) as v)
     is distinct from (select array_agg(v order by v) from unnest(product_mimes) as v) then
    raise exception 'product-media bucket MIME allowlist does not match production contract';
  end if;

  select * into support_bucket from storage.buckets where id = 'support-attachments';
  if not found then
    raise exception 'storage bucket support-attachments is required';
  end if;
  if support_bucket.public is distinct from false then
    raise exception 'support-attachments bucket must be private';
  end if;
  if support_bucket.file_size_limit is distinct from 10485760 then
    raise exception 'support-attachments bucket must have 10 MB file_size_limit';
  end if;
  if (select array_agg(v order by v) from unnest(coalesce(support_bucket.allowed_mime_types, '{}'::text[])) as v)
     is distinct from (select array_agg(v order by v) from unnest(support_mimes) as v) then
    raise exception 'support-attachments bucket MIME allowlist does not match production contract';
  end if;
end $$;

-- Product/homepage/review media mutations are server-mediated with service_role.
-- Do not add authenticated direct product-media write policies here.
-- Support attachments remain private and are accessed through signed server routes.
