# Aevyrixa Admin Order Operations

The admin order dashboard is a daily operations view over the orders returned by
`GET /api/orders`. Supabase remains the source of truth when the Supabase
environment variables are configured; the browser localStorage fallback is only
for development visibility.

## Order Workflow

Use the quick status dropdown on each order card:

1. `Pending` - new checkout order that needs review.
2. `Confirmed` - customer and payment details are accepted.
3. `Shipped` - order is handed to delivery.
4. `Delivered` - customer received the order.
5. `Cancelled` - order should not be fulfilled.

Status updates call `PATCH /api/orders/[orderRef]` and update the visible
analytics cards immediately. Refreshing admin should show the same status from
Supabase when the backend is configured.

## Search, Filters, and Sort

The order management page filters the already-loaded order list in the browser.
It does not make extra database queries.

- Search matches order reference, customer name, or phone number.
- Status filter supports All, Pending, Confirmed, Shipped, Delivered, and
  Cancelled.
- Payment filter supports All, Cash on Delivery, Mobile Wallet Payment, and
  Bank Transfer.
- Sort supports newest first, oldest first, highest total, and lowest total.

These controls reset on page reload by design.

## Copy and Contact Actions

Expanded order details include non-destructive actions for daily handling:

- Copy order summary.
- Copy customer contact.
- Copy delivery address.
- Copy payment reference when available.
- Copy individual phone, order reference, delivery address, and transaction ID
  fields.
- Open `tel:` for the customer phone when the device supports phone links.

Copy actions use `navigator.clipboard` when available, with a small copied
confirmation in the admin UI.

## Notifications

Telegram notification only runs on new order creation after `POST /api/orders`
saves successfully. Admin status changes do not trigger Telegram notifications.

The service role key and Telegram credentials are read only by server route
code. They must not be exposed in client components.
