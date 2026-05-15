# Store Settings

Phase 20 centralizes public launch settings for Aevyrixa Her Care support,
delivery, privacy packaging, and hygiene-sensitive support copy.

## Public Settings

The shared settings model lives in `app/lib/admin-settings.ts` and is served by
`GET /api/settings`.

- `storeName`
- `supportPhone`
- `supportWhatsApp`
- `supportEmail`
- `facebookPageUrl`
- `instagramUrl`
- `tiktokUrl`
- `businessLocation`
- `deliveryCoverageText`
- `codMessage`
- `privacyPackagingMessage`
- `supportWindowMessage`
- `hygieneReturnMessage`
- `orderConfirmationMessage`

The app keeps existing checkout payment settings in the same normalized object
so checkout wallet receiver behavior remains compatible.

## Supabase Backend

Settings persist only when these server-side environment variables are present:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Create this table in Supabase when ready:

```sql
create table if not exists public.store_settings (
  id text primary key default 'public',
  store_name text not null default 'Aevyrixa Her Care',
  support_phone text,
  support_whatsapp text,
  support_email text,
  facebook_page_url text,
  instagram_url text,
  tiktok_url text,
  business_location text,
  delivery_coverage_text text,
  cod_message text,
  privacy_packaging_message text,
  support_window_message text,
  hygiene_return_message text,
  order_confirmation_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id)
values ('public')
on conflict (id) do nothing;
```

The API uses the service role key only in server code. Do not expose the service
role key in client components.

## Admin Editing

Open `/admin/settings` after admin login. The page edits:

- Support phone
- WhatsApp number
- Support email
- Facebook page URL
- Delivery coverage
- COD message
- Privacy packaging message
- 3-Day Hygiene-Safe Support message
- Order confirmation support note

If Supabase settings are connected, saving writes to `public.store_settings` and
values persist after refresh. If the table or env vars are missing, the admin
shows "settings backend not connected" and keeps a safe browser-local fallback.

## Hygiene-Sensitive Copy

Keep these messages conservative:

- Use "3-Day Hygiene-Safe Support".
- Say eligible support requires unused, unwashed items in original packaging
  with tags and hygiene liner/seal where applicable.
- Mention discreet privacy packaging.
- Mention Bangladesh delivery and COD support.
- Do not make medical claims.
- Do not say products are 100% leak-proof.
- Do not promise guaranteed cures, protection, refunds, or exchanges.
