# Settings Control Room

Phase 21 rebuilds `/admin/settings` into the Aevyrixa Her Care business
Control Room. The admin page keeps the premium dark/glass style and edits one
normalized settings object with grouped sections.

## Sections

- `storeProfile`: store name, subtitle, location, support contacts, social URLs,
  and `storeStatus`.
- `paymentSettings`: COD, wallet enablement and receiver numbers, bank transfer
  details, and payment instructions.
- `checkoutSettings`: checkout copy, order confirmation copy, cart empty copy,
  and future-ready order/free-delivery thresholds.
- `deliverySettings`: coverage text, delivery charge placeholders, couriers,
  dispatch message, and tracking support copy.
- `policySettings`: 3-Day Hygiene-Safe Support copy, unused/unwashed condition,
  hygiene seal copy, privacy packaging, size guidance, and no-medical-claims
  notice.
- `orderSettings`: default order status/source/staff, payment verification
  default, proof default, low-stock threshold, order prefix, and future
  auto-cancel days.
- `notificationSettings`: Telegram notification toggles and customer message
  templates.
- `seoSettings`: homepage metadata, product SEO suffix, pixel/analytics IDs, and
  Open Graph image URL.
- `appearanceSettings`: future homepage/announcement copy and accent color.
- `advancedSettings`: maintenance/test/debug flags, future purge retention,
  system version label, and backup reminder.

## Public Settings

`GET /api/settings` returns only public-safe settings for unauthenticated
requests:

- `storeProfile`
- `paymentSettings`
- `checkoutSettings`
- `deliverySettings`
- `policySettings`
- `seoSettings`
- `appearanceSettings`
- legacy compatibility aliases used by existing pages, such as `storeName`,
  `supportPhone`, `deliveryCoverageText`, `codMessage`,
  `walletReceiverNumbers`, and `bankTransferInstruction`

These public settings continue to power checkout payment options/messages,
footer/contact support details, policy pages, order success support text, and
tracking support copy.

## Admin-Only Settings

Authenticated admin requests can read and save the full object, including:

- `orderSettings`
- `notificationSettings`
- `advancedSettings`

Secrets must never be stored in the settings table. Telegram bot token,
Supabase service key, admin password, and other secrets stay in Vercel
Environment Variables. The admin UI only shows Telegram Chat ID as
`Configured in environment`.

## Future-Ready Values

The following settings are saved but not enforced by Phase 21 unless a previous
feature already used them:

- `minimumOrderAmount`
- `freeDeliveryThreshold`
- `defaultDeliveryCharge`
- `insideDhakaDeliveryCharge`
- `outsideDhakaDeliveryCharge`
- `autoCancelPendingAfterDays`
- `lowStockAlertThreshold`
- pixel/analytics IDs
- appearance/homepage copy
- maintenance/test/debug flags
- deleted product purge retention

No destructive purge, clear-data, or auto-cancel action is active in this phase.

## Supabase SQL

The app still builds and runs against the old column-based
`public.store_settings` table. Saving first tries the grouped JSON columns and
falls back to the legacy columns if the migration has not been applied.

Apply this SQL to persist every Phase 21 section:

```sql
alter table public.store_settings
  add column if not exists store_profile jsonb,
  add column if not exists payment_settings jsonb,
  add column if not exists checkout_settings jsonb,
  add column if not exists delivery_settings jsonb,
  add column if not exists policy_settings jsonb,
  add column if not exists order_settings jsonb,
  add column if not exists notification_settings jsonb,
  add column if not exists seo_settings jsonb,
  add column if not exists appearance_settings jsonb,
  add column if not exists advanced_settings jsonb;

insert into public.store_settings (id)
values ('public')
on conflict (id) do nothing;
```

Legacy columns should remain in place so older public aliases and previous data
stay preserved:

```sql
alter table public.store_settings
  add column if not exists store_name text,
  add column if not exists support_phone text,
  add column if not exists support_whatsapp text,
  add column if not exists support_email text,
  add column if not exists facebook_page_url text,
  add column if not exists instagram_url text,
  add column if not exists tiktok_url text,
  add column if not exists business_location text,
  add column if not exists delivery_coverage_text text,
  add column if not exists cod_message text,
  add column if not exists privacy_packaging_message text,
  add column if not exists support_window_message text,
  add column if not exists hygiene_return_message text,
  add column if not exists order_confirmation_message text,
  add column if not exists updated_at timestamptz;
```

## Copy Guardrails

- Keep BDT as the active currency.
- Keep "3-Day Hygiene-Safe Support" wording.
- Do not make medical claims.
- Do not claim products are 100% leak-proof.
- Keep privacy packaging and hygiene-seal language conservative.
