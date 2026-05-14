# Aevyrixa Order Backend Setup

Phase 13A connects checkout and admin order storage to Supabase through the
server API routes:

- `app/api/orders/route.ts`
- `app/api/orders/[orderRef]/route.ts`
- `app/lib/order-store.ts`

Client checkout and admin screens continue to call the local API routes. They do
not talk directly to Supabase.

## Environment Variables

Add these in Vercel Project Settings -> Environment Variables for Production,
Preview, and Development as needed:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ORDER_NOTIFICATION_TELEGRAM_BOT_TOKEN=
ORDER_NOTIFICATION_TELEGRAM_CHAT_ID=
```

For local development, create `.env.local` with the same values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ORDER_NOTIFICATION_TELEGRAM_BOT_TOKEN=123456789:your-bot-token
ORDER_NOTIFICATION_TELEGRAM_CHAT_ID=123456789
```

Never commit `.env.local` or the service role key. The service role key must only
be read from server-side code. Telegram notification credentials are also
server-side only. Do not import service keys, bot tokens, or chat IDs into client
components.

## Supabase Table

Create `public.orders` in Supabase SQL Editor:

```sql
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  city_area text not null,
  delivery_address text not null,
  size_fit_note text,
  delivery_note text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  total numeric not null default 0,
  payment_method text not null,
  wallet_provider text,
  payment_type text,
  receiver_number text,
  sender_number text,
  transaction_id text,
  status text not null default 'Pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create index if not exists orders_status_idx
  on public.orders (status);
```

The order adapter writes through Supabase REST using the service role key from
server route handlers. It inserts customer and payment fields into scalar
columns, keeps line items in `items jsonb`, and updates `status` plus
`updated_at` from admin PATCH requests.

## Storage Behavior

- With `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, orders are
  created, listed, and updated in `public.orders`.
- Without those variables, the API uses the safe demo-memory fallback so local
  development and Vercel builds still pass.
- Checkout stores the saved order in browser localStorage only after the API
  save succeeds. This keeps the current local admin fallback usable.
- Admin fetches `/api/orders` first, merges with local fallback data, and
  deduplicates by `order_ref` / order reference.
- Admin status changes call `PATCH /api/orders/[orderRef]`; local fallback sync
  remains for no-database development.

## Vercel Deployment

1. Add `NEXT_PUBLIC_SUPABASE_URL`.
2. Add `SUPABASE_SERVICE_ROLE_KEY` as a secret value.
3. Optional: add `ORDER_NOTIFICATION_TELEGRAM_BOT_TOKEN`.
4. Optional: add `ORDER_NOTIFICATION_TELEGRAM_CHAT_ID`.
5. Redeploy the site after saving environment variables.
6. Submit a checkout order and confirm it appears in Supabase and in admin from
   another browser/device.

## Telegram Order Notifications

`app/lib/order-notifications.ts` exposes `notifyNewOrder(order)`. The checkout
API calls it only after an order is saved. Notification failures are logged and
do not block the successful checkout response.

- `ORDER_NOTIFICATION_TELEGRAM_BOT_TOKEN`
- `ORDER_NOTIFICATION_TELEGRAM_CHAT_ID`

To create a Telegram bot:

1. Open Telegram and search for `@BotFather`.
2. Send `/newbot`.
3. Follow the prompts for the bot name and username.
4. Copy the bot token that BotFather returns.
5. Save it as `ORDER_NOTIFICATION_TELEGRAM_BOT_TOKEN` in Vercel and in local
   `.env.local` when testing locally.

To get a Telegram chat ID:

1. Send a message to the new bot from the Telegram account or group that should
   receive order alerts.
2. Open this URL in a browser, replacing the token:
   `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Find the `chat.id` value in the response.
4. Save that value as `ORDER_NOTIFICATION_TELEGRAM_CHAT_ID`.

If either Telegram environment variable is missing, `notifyNewOrder(order)`
returns a skipped status and checkout continues normally. Telegram bot tokens
and chat IDs are read only from server route execution; they are never exposed
to browser-side checkout or admin code.
