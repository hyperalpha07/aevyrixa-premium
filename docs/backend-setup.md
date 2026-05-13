# Aevyrixa Order Backend Setup

Phase 12 adds a backend-ready order capture layer at `app/api/orders/route.ts`
and `app/api/orders/[orderRef]/route.ts`. The site still builds and accepts
demo/local orders when backend credentials are not configured.

## Future Environment Variables

Add these in Vercel Project Settings -> Environment Variables. Do not commit
secret values to the repository.

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ORDER_NOTIFICATION_TELEGRAM_BOT_TOKEN=
ORDER_NOTIFICATION_TELEGRAM_CHAT_ID=
```

## Storage Behavior

- With `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, the order
  adapter in `app/lib/order-store.ts` is ready to write, read, and update order
  statuses from a Supabase/Postgres `orders` table.
- Without those variables, the API uses a safe demo-memory fallback so local
  development and Vercel builds do not fail.
- Checkout also stores the saved order in browser localStorage to keep the
  current admin orders UI usable until the production database is connected.
- Admin status changes call the API route when possible and keep the local
  admin fallback compatible while the backend is still demo-only.

## Notification Placeholder

`app/lib/order-notifications.ts` exposes `notifyNewOrder(order)`. It is safe
without notification credentials and currently skips delivery. A future phase
can connect Telegram or email by using these Vercel Environment Variables:

- `ORDER_NOTIFICATION_TELEGRAM_BOT_TOKEN`
- `ORDER_NOTIFICATION_TELEGRAM_CHAT_ID`

## Suggested Supabase Table Shape

Create an `orders` table that can store JSON order details:

```sql
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  order_reference text not null unique,
  customer jsonb not null,
  payment_details jsonb not null,
  items jsonb not null,
  totals jsonb not null,
  total_amount numeric not null,
  status text not null default 'Pending',
  created_at timestamptz not null default now()
);
```

The service role key is used only from server-side route handlers. Never expose
it in client components.
