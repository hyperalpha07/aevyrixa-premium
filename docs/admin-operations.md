# Aevyrixa Admin Order Operations

The admin panel is organized as a future-ready Aevyrixa Control Room over the
orders returned by `GET /api/orders`. Supabase remains the source of truth when
the Supabase environment variables are configured; the browser localStorage
fallback is only for development visibility.

## Dashboard vs. Orders

The Dashboard is an overview only. It shows analytics cards, today's action
queue signals, payment mix, recent order previews, and quick links into the
working areas. Recent order cards intentionally show only essential summary
fields so the dashboard stays readable.

The Orders page is the main working area for order handling. It keeps search,
status filter, payment filter, and sort controls at the top, then shows the
order list beside or above a selected order detail panel depending on screen
width.

## Order Workflow

Use the quick status dropdown on each order card:

`Pending` -> `Confirmed` -> `Shipped` -> `Delivered` / `Cancelled`

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

Selected order details include non-destructive actions for daily handling:

- Copy order summary.
- Copy customer contact.
- Copy delivery address.
- Copy payment details.
- Copy individual phone, order reference, delivery address, and transaction ID
  fields.
- Open `tel:` for the customer phone when the device supports phone links.

Copy actions use `navigator.clipboard` when available, with a small copied
confirmation in the admin UI.

## Order Detail Sections

The Orders page detail panel is grouped for daily operations:

- Customer: name, phone, email when available, city/area, delivery address, and
  useful copy actions.
- Payment: payment method, wallet provider, payment type, receiver number,
  sender number, transaction/reference ID, total, and a payment verification
  placeholder.
- Delivery: delivery address, delivery note, and planned operations rows.
- Items: product name, size/color/absorbency or variant details, quantity, unit
  price, and line total.
- Support / Future Ops: after-sales and internal operations placeholders.

The following future fields are planned but are currently UI placeholders only
until the database schema is extended:

- Courier name.
- Tracking ID.
- Delivery charge.
- Customer confirmation note.
- Payment verification status.
- Refund/exchange request.
- Size issue report.
- Photo/video proof received.
- Admin internal note.
- Order source.
- Assigned staff.

Do not treat these placeholder rows as saved order data yet. Adding persistence
for them requires a later Supabase schema and API phase.

## Notifications

Telegram notification only runs on new order creation after `POST /api/orders`
saves successfully. Admin status changes do not trigger Telegram notifications.

The service role key and Telegram credentials are read only by server route
code. They must not be exposed in client components.
