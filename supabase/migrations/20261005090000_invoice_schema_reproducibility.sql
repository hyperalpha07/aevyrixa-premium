-- Admin V2 invoice schema reproducibility.
-- This migration captures the invoice infrastructure required by Admin V2 invoice
-- issuance, invoice listing/detail, Reports and Billing so fresh environments can
-- reproduce the currently deployed live invoice schema safely.
--
-- It is intentionally invoice-only:
-- - safe creation of missing invoice infrastructure where prerequisites match
-- - no historical invoice rewrite
-- - no arbitrary damaged-table repair/backfill
-- - no AEV -> NOR migration
-- - no document file storage
-- - no payment lifecycle
-- - no fiscal-rate fields

do $$
begin
  if to_regclass('public.orders') is null then
    raise exception 'Preflight failed: public.orders is required before creating public.invoices.';
  end if;

  if not exists (
    select 1
    from pg_attribute a
    join pg_type t on t.oid = a.atttypid
    where a.attrelid = 'public.orders'::regclass
      and a.attname = 'order_ref'
      and not a.attisdropped
      and t.typname = 'text'
      and a.attnotnull
  ) then
    raise exception 'Preflight failed: public.orders.order_ref must exist as text not null before creating public.invoices.';
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid
    where c.conrelid = 'public.orders'::regclass
      and c.contype in ('u', 'p')
      and a.attname = 'order_ref'
      and not a.attisdropped
      and c.conkey = array[a.attnum]::smallint[]
  ) then
    raise exception 'Preflight failed: public.orders.order_ref must have its own single-column unique or primary key before creating public.invoices.';
  end if;
end $$;

do $$
declare
  v_seq_last_value bigint;
  v_seq_is_called boolean;
  v_next_sequence_value bigint;
  v_max_invoice_suffix bigint;
begin
  if to_regclass('public.invoices') is null then
    create sequence if not exists public.admin_v2_invoice_number_seq
      as bigint
      increment by 1
      minvalue 1
      no maxvalue
      no cycle;
  elsif to_regclass('public.admin_v2_invoice_number_seq') is null then
    raise exception 'Preflight failed: existing public.invoices requires existing public.admin_v2_invoice_number_seq.';
  end if;

  if to_regclass('public.invoices') is not null then
    if exists (
      select 1
      from (
        values
          ('id', 'uuid', true),
          ('invoice_number', 'text', true),
          ('order_ref', 'text', true),
          ('status', 'text', true),
          ('issued_at', 'timestamptz', true),
          ('issued_by_admin_id', 'text', false),
          ('issued_by', 'text', false),
          ('actor_source', 'text', true),
          ('subtotal_amount', 'numeric', true),
          ('discount_amount', 'numeric', true),
          ('delivery_amount', 'numeric', true),
          ('total_amount', 'numeric', true),
          ('currency_code', 'text', true),
          ('snapshot', 'jsonb', true),
          ('created_at', 'timestamptz', true)
      ) as expected(attname, typname, attnotnull)
      where not exists (
        select 1
        from pg_attribute a
        join pg_type t on t.oid = a.atttypid
        where a.attrelid = 'public.invoices'::regclass
          and a.attname = expected.attname
          and not a.attisdropped
          and t.typname = expected.typname
          and a.attnotnull = expected.attnotnull
      )
    ) then
      raise exception 'Preflight failed: existing public.invoices columns are incompatible with the deployed invoice schema.';
    end if;

    if exists (
      select 1
      from (
        values
          ('id', 'gen_random_uuid()'),
          ('status', '''issued''::text'),
          ('issued_at', 'now()'),
          ('actor_source', '''admin''::text'),
          ('created_at', 'now()')
      ) as expected(attname, default_expr)
      where not exists (
        select 1
        from pg_attribute a
        join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
        where a.attrelid = 'public.invoices'::regclass
          and a.attname = expected.attname
          and not a.attisdropped
          and lower(regexp_replace(pg_get_expr(d.adbin, d.adrelid), '\s+', '', 'g')) =
            lower(regexp_replace(expected.default_expr, '\s+', '', 'g'))
      )
    ) then
      raise exception 'Preflight failed: existing public.invoices defaults are incompatible with the deployed invoice schema.';
    end if;

    if not exists (
      select 1
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid
      where c.conrelid = 'public.invoices'::regclass
        and c.contype = 'p'
        and a.attname = 'id'
        and c.conkey = array[a.attnum]::smallint[]
    ) then
      raise exception 'Preflight failed: existing public.invoices must have a single-column primary key on id.';
    end if;

    if not exists (
      select 1
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid
      where c.conrelid = 'public.invoices'::regclass
        and c.contype = 'u'
        and a.attname = 'invoice_number'
        and c.conkey = array[a.attnum]::smallint[]
    ) then
      raise exception 'Preflight failed: existing public.invoices must have a single-column unique constraint on invoice_number.';
    end if;

    if not exists (
      select 1
      from pg_constraint c
      join pg_attribute child_order_ref on child_order_ref.attrelid = c.conrelid
      join pg_attribute parent_order_ref on parent_order_ref.attrelid = c.confrelid
      where c.conrelid = 'public.invoices'::regclass
        and c.confrelid = 'public.orders'::regclass
        and c.contype = 'f'
        and child_order_ref.attname = 'order_ref'
        and parent_order_ref.attname = 'order_ref'
        and c.conkey = array[child_order_ref.attnum]::smallint[]
        and c.confkey = array[parent_order_ref.attnum]::smallint[]
        and c.confupdtype = 'c'
        and c.confdeltype = 'r'
    ) then
      raise exception 'Preflight failed: existing public.invoices.order_ref foreign key is incompatible.';
    end if;

    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.invoices'::regclass
        and contype = 'c'
        and lower(regexp_replace(pg_get_constraintdef(oid), '\s+', '', 'g')) in (
          'check((status=any(array[''issued''::text,''void''::text])))',
          'check((status=any(array[(''issued''::character varying)::text,(''void''::character varying)::text])))',
          'check(((status=''issued''::text)or(status=''void''::text)))',
          'check(((status=''void''::text)or(status=''issued''::text)))'
        )
    ) then
      raise exception 'Preflight failed: existing public.invoices must restrict status to issued/void.';
    end if;

    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.invoices'::regclass
        and contype = 'c'
        and lower(regexp_replace(pg_get_constraintdef(oid), '\s+', '', 'g')) =
          'check((length(btrim(invoice_number))>=8)and(length(btrim(invoice_number))<=80))'
    ) then
      raise exception 'Preflight failed: existing public.invoices invoice_number length constraint is incompatible.';
    end if;

    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.invoices'::regclass
        and contype = 'c'
        and lower(regexp_replace(pg_get_constraintdef(oid), '\s+', '', 'g')) =
          'check((issued_by_admin_idisnull)or((length(btrim(issued_by_admin_id))>=1)and(length(btrim(issued_by_admin_id))<=200)))'
    ) then
      raise exception 'Preflight failed: existing public.invoices issued_by_admin_id constraint is incompatible.';
    end if;

    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.invoices'::regclass
        and contype = 'c'
        and lower(regexp_replace(pg_get_constraintdef(oid), '\s+', '', 'g')) =
          'check((issued_byisnull)or(((length(btrim(issued_by))>=1)and(length(btrim(issued_by))<=200))and(lower(btrim(issued_by))<>''owner''::text)))'
    ) then
      raise exception 'Preflight failed: existing public.invoices issued_by constraint is incompatible.';
    end if;

    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.invoices'::regclass
        and contype = 'c'
        and lower(regexp_replace(pg_get_constraintdef(oid), '\s+', '', 'g')) in (
          'check((actor_source=any(array[''admin''::text,''system''::text])))',
          'check(((actor_sourceisnotnull)and(actor_source=any(array[''admin''::text,''system''::text]))))'
        )
    ) then
      raise exception 'Preflight failed: existing public.invoices actor_source constraint is incompatible.';
    end if;

    if exists (
      select 1
      from (
        values ('subtotal_amount'), ('discount_amount'), ('delivery_amount'), ('total_amount')
      ) as amount_columns(column_name)
      where not exists (
        select 1 from pg_constraint
        where conrelid = 'public.invoices'::regclass
          and contype = 'c'
          and lower(regexp_replace(pg_get_constraintdef(oid), '\s+', '', 'g')) =
            format('check((%s>=0))', amount_columns.column_name)
      )
    ) then
      raise exception 'Preflight failed: existing public.invoices amount constraints are incompatible.';
    end if;

    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.invoices'::regclass
        and contype = 'c'
        and lower(regexp_replace(pg_get_constraintdef(oid), '\s+', '', 'g')) =
          'check((abs((total_amount-((subtotal_amount-discount_amount)+delivery_amount)))<=(0.01)::numeric))'
    ) then
      raise exception 'Preflight failed: existing public.invoices total arithmetic constraint is incompatible.';
    end if;

    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.invoices'::regclass
        and contype = 'c'
        and lower(regexp_replace(pg_get_constraintdef(oid), '\s+', '', 'g')) =
          'check((currency_code~''^[A-Z]{3}$''::text))'
    ) then
      raise exception 'Preflight failed: existing public.invoices currency constraint is incompatible.';
    end if;

    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.invoices'::regclass
        and contype = 'c'
        and lower(regexp_replace(pg_get_constraintdef(oid), '\s+', '', 'g')) =
          'check(((jsonb_typeof(snapshot)=''object''::text)and(length((snapshot)::text)<=32768)and(snapshot?''orderReference''::text)and(snapshot?''items''::text)and(snapshot?''totals''::text)and(snapshot?''customer''::text)and(snapshot?''payment''::text)))'
    ) then
      raise exception 'Preflight failed: existing public.invoices snapshot constraint is incompatible.';
    end if;

    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.invoices'::regclass
        and contype = 'c'
        and lower(regexp_replace(pg_get_constraintdef(oid), '\s+', '', 'g')) =
          'check((length((snapshot)::text)<=32768))'
    ) then
      raise exception 'Preflight failed: existing public.invoices snapshot size constraint is incompatible.';
    end if;

    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.invoices'::regclass
        and contype = 'c'
        and lower(regexp_replace(pg_get_constraintdef(oid), '\s+', '', 'g')) =
          'check(((status<>''issued''::text)or((actor_source=''admin''::text)and((nullif(btrim(issued_by_admin_id),''''::text)isnotnull)or(nullif(btrim(issued_by),''''::text)isnotnull))and((issued_byisnull)or(lower(btrim(issued_by))<>''owner''::text)))or((actor_source=''system''::text)and(issued_by=''System''::text)and(issued_by_admin_idisnull))))'
    ) then
      raise exception 'Preflight failed: existing public.invoices issuer integrity constraint is incompatible.';
    end if;

    if not exists (
      select 1
      from pg_index i
      join pg_class idx on idx.oid = i.indexrelid
      join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
      where i.indrelid = 'public.invoices'::regclass
        and idx.relname = 'invoices_one_issued_per_order_idx'
        and i.indisunique
        and i.indpred is not null
        and a.attname = 'order_ref'
        and array_length(string_to_array(i.indkey::text, ' '), 1) = 1
        and i.indkey::text = a.attnum::text
        and lower(regexp_replace(pg_get_expr(i.indpred, i.indrelid), '\s+', '', 'g')) =
          '((status=''issued''::text))'
    ) then
      raise exception 'Preflight failed: existing public.invoices one-issued-invoice-per-order index is incompatible.';
    end if;

    if not exists (
      select 1
      from pg_sequence s
      where s.seqrelid = 'public.admin_v2_invoice_number_seq'::regclass
        and s.seqtypid = 'bigint'::regtype
        and s.seqincrement = 1
        and s.seqmin = 1
        and s.seqmax >= 999999
        and not s.seqcycle
    ) then
      raise exception 'Preflight failed: existing public.admin_v2_invoice_number_seq properties are incompatible.';
    end if;

    execute 'select last_value, is_called from public.admin_v2_invoice_number_seq'
      into v_seq_last_value, v_seq_is_called;

    select coalesce(max(substring(invoice_number from '^AEV-INV-[0-9]{8}-([0-9]{6,})$')::bigint), 0)
      into v_max_invoice_suffix
      from public.invoices
      where invoice_number ~ '^AEV-INV-[0-9]{8}-[0-9]{6,}$';

    v_next_sequence_value := case
      when v_seq_is_called then v_seq_last_value + 1
      else v_seq_last_value
    end;

    if v_next_sequence_value <= v_max_invoice_suffix then
      raise exception 'Preflight failed: public.admin_v2_invoice_number_seq is behind existing invoice numbers.';
    end if;
  end if;

  if not exists (
    select 1
    from pg_sequence s
    where s.seqrelid = 'public.admin_v2_invoice_number_seq'::regclass
      and s.seqtypid = 'bigint'::regtype
      and s.seqincrement = 1
      and s.seqmin = 1
      and s.seqmax >= 999999
      and not s.seqcycle
  ) then
    raise exception 'Preflight failed: public.admin_v2_invoice_number_seq properties are incompatible.';
  end if;
end $$;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique check (length(btrim(invoice_number)) between 8 and 80),
  order_ref text not null references public.orders(order_ref) on update cascade on delete restrict,
  status text not null default 'issued' check (status in ('issued', 'void')),
  issued_at timestamptz not null default now(),
  issued_by_admin_id text check (issued_by_admin_id is null or length(btrim(issued_by_admin_id)) between 1 and 200),
  issued_by text check (issued_by is null or (length(btrim(issued_by)) between 1 and 200 and lower(btrim(issued_by)) <> 'owner')),
  actor_source text not null default 'admin' check (actor_source in ('admin', 'system')),
  subtotal_amount numeric not null check (subtotal_amount >= 0),
  discount_amount numeric not null check (discount_amount >= 0),
  delivery_amount numeric not null check (delivery_amount >= 0),
  total_amount numeric not null check (total_amount >= 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  snapshot jsonb not null check (
    jsonb_typeof(snapshot) = 'object'
    and length(snapshot::text) <= 32768
    and snapshot ? 'orderReference'
    and snapshot ? 'items'
    and snapshot ? 'totals'
    and snapshot ? 'customer'
    and snapshot ? 'payment'
  ),
  created_at timestamptz not null default now(),
  check (abs(total_amount - ((subtotal_amount - discount_amount) + delivery_amount)) <= 0.01)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'invoices_actor_source_valid'
      and conrelid = 'public.invoices'::regclass
  ) then
    alter table public.invoices
      add constraint invoices_actor_source_valid
      check (actor_source is not null and actor_source in ('admin', 'system'))
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'invoices_issuer_integrity'
      and conrelid = 'public.invoices'::regclass
  ) then
    alter table public.invoices
      add constraint invoices_issuer_integrity
      check (
        status <> 'issued'
        or (
          actor_source = 'admin'
          and (nullif(btrim(issued_by_admin_id), '') is not null or nullif(btrim(issued_by), '') is not null)
          and (issued_by is null or lower(btrim(issued_by)) <> 'owner')
        )
        or (
          actor_source = 'system'
          and issued_by = 'System'
          and issued_by_admin_id is null
        )
      )
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'invoices_snapshot_size'
      and conrelid = 'public.invoices'::regclass
  ) then
    alter table public.invoices
      add constraint invoices_snapshot_size
      check (length(snapshot::text) <= 32768)
      not valid;
  end if;
end $$;

create unique index if not exists invoices_one_issued_per_order_idx
  on public.invoices(order_ref)
  where status = 'issued';

create index if not exists invoices_order_ref_idx
  on public.invoices(order_ref);

create index if not exists invoices_created_at_idx
  on public.invoices(created_at desc);

create or replace function public.admin_v2_next_invoice_number(
  p_order_ref text,
  p_issued_at timestamptz default now()
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order_ref text := nullif(btrim(p_order_ref), '');
  v_issued_at timestamptz := coalesce(p_issued_at, now());
begin
  if v_order_ref is null then
    raise exception 'Order reference is required for invoice numbering.';
  end if;

  return 'AEV-INV-'
    || to_char(v_issued_at at time zone 'UTC', 'YYYYMMDD')
    || '-'
    || lpad(nextval('public.admin_v2_invoice_number_seq')::text, 6, '0');
end;
$$;

alter table public.invoices enable row level security;

revoke all on table public.invoices from public, anon, authenticated;
revoke all on sequence public.admin_v2_invoice_number_seq from public, anon, authenticated;
revoke execute on function public.admin_v2_next_invoice_number(text, timestamptz) from public, anon, authenticated;
revoke all on table public.invoices from service_role;
revoke all on sequence public.admin_v2_invoice_number_seq from service_role;
revoke execute on function public.admin_v2_next_invoice_number(text, timestamptz) from service_role;

grant select, insert, update, delete on table public.invoices to service_role;
grant usage, select on sequence public.admin_v2_invoice_number_seq to service_role;
grant execute on function public.admin_v2_next_invoice_number(text, timestamptz) to service_role;

drop policy if exists "invoices_service_role_all" on public.invoices;
create policy "invoices_service_role_all"
  on public.invoices
  for all
  to service_role
  using (true)
  with check (true);
