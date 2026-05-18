# Aevyrixa Admin Order Operations

The admin panel is organized as a full-width, future-ready Aevyrixa Control
Room over the orders returned by `GET /api/orders`. It uses a dedicated admin
app shell instead of the public site container so desktop screens can hold a
sidebar, operational filters, the order queue, and a wide selected-order command
panel. Supabase remains the source of truth when the Supabase environment
variables are configured; the browser localStorage fallback is only for
development visibility.

## Dashboard vs. Orders

The Dashboard is an overview only. It shows analytics cards, today's action
queue signals, payment mix, recent order previews, and quick links into the
working areas. Recent order cards intentionally show only essential summary
fields so the dashboard stays readable.

The Orders page is the main working area for order handling. It keeps search,
status filter, payment filter, and sort controls at the top, then shows the
order queue beside a selected order detail panel on desktop. On tablet and
mobile, the same controls stack into one column with the selected details below
the queue and without horizontal overflow.

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

The same admin-only endpoint now also accepts order fulfillment and support
operations fields. The quick status dropdown still sends status-only updates,
while the selected order panel's Save Operations button sends the broader
operations payload.

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
  sender number, transaction/reference ID, total, and payment verification
  status.
- Delivery: delivery address, delivery note, courier name, tracking ID,
  delivery charge, and assigned staff.
- Items: product name, size/color/absorbency or variant details, quantity, unit
  price, and line total.
- Support / Internal Ops: after-sales, proof, source, and internal note fields.

## Fulfillment Fields

Use the operations form on the selected order panel for production handling:

- Courier Name: delivery partner name such as Pathao, RedX, or Steadfast.
- Tracking ID: courier tracking or consignment reference.
- Delivery Charge: numeric delivery fee.
- Payment Verification Status: Pending, Verified, Failed, or Not Required.
- Customer Confirmation Note: call or message confirmation notes.
- Assigned Staff: staff member responsible for follow-up.
- Order Source: Website, Facebook, Manual, or Other.
- Admin Internal Note: private operational notes.
- Refund / Exchange Request: support request details.
- Size Issue Report: fit or sizing problem notes.
- Proof Received: No, Yes, or Requested.

For shipped orders, add Courier Name and Tracking ID before or immediately
after setting status to `Shipped`.

Admin-only fields:

- `paymentVerificationStatus`
- `customerConfirmationNote`
- `refundExchangeRequest`
- `sizeIssueReport`
- `proofReceived`
- `adminInternalNote`
- `orderSource`
- `assignedStaff`

Customer-safe fields:

- `status`
- `courierName`
- `trackingId`
- `deliveryCharge`

The public tracking endpoint returns only customer-safe order information after
matching order reference and phone number. It must not expose admin internal
notes, payment verification handling, proof status, refund/exchange details, or
size issue reports.

## Supabase SQL

If these columns do not exist, admin operations updates will fail gracefully in
the UI with a migration warning and the existing checkout flow will continue to
save new orders. Apply this SQL in Supabase before relying on persistence:

```sql
alter table public.orders
  add column if not exists courier_name text,
  add column if not exists tracking_id text,
  add column if not exists delivery_status text,
  add column if not exists delivery_charge numeric,
  add column if not exists delivery_area text,
  add column if not exists delivery_zone text,
  add column if not exists customer_confirmation_note text,
  add column if not exists payment_status text,
  add column if not exists payment_reference text,
  add column if not exists payment_note text,
  add column if not exists payment_verification_status text
    check (
      payment_verification_status is null
      or payment_verification_status in ('Pending', 'Verified', 'Failed', 'Not Required')
    ),
  add column if not exists refund_exchange_request text,
  add column if not exists size_issue_report text,
  add column if not exists proof_received text
    check (
      proof_received is null
      or proof_received in ('No', 'Yes', 'Requested')
    ),
  add column if not exists admin_internal_note text,
  add column if not exists order_source text
    check (
      order_source is null
      or order_source in ('Website', 'Facebook', 'Manual', 'Other')
    ),
  add column if not exists assigned_staff text,
  add column if not exists is_test_order boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists soft_deleted_at timestamptz,
  add column if not exists cancelled_reason text;
```

Future courier API credentials must stay in server-side environment variables,
not public storefront/admin settings:

- `PATHAO_CLIENT_ID`
- `PATHAO_CLIENT_SECRET`
- `PATHAO_USERNAME`
- `PATHAO_PASSWORD`
- `PATHAO_STORE_ID`
- `STEADFAST_API_KEY`
- `STEADFAST_SECRET_KEY`
- `REDX_API_KEY`
- `COURIER_API_BASE_URL`

## Notifications

Telegram notification only runs on new order creation after `POST /api/orders`
saves successfully. Admin status changes do not trigger Telegram notifications.

The service role key and Telegram credentials are read only by server route
code. They must not be exposed in client components.

## Admin Security

Production admin access requires these Vercel environment variables:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

Add them in Vercel under Project Settings -> Environment Variables, then
redeploy the production deployment so the server can read them. Do not commit
real admin usernames, passwords, Supabase keys, service role keys, or Telegram
tokens to the repository.

Admin login is handled by `POST /api/admin/login`. The password is sent only to
server route code, and the browser receives an httpOnly signed session cookie.
Client JavaScript cannot read the admin password or the session cookie value.
`POST /api/admin/logout` clears the cookie.

The protected admin pages are:

- `/admin`
- `/admin/orders`
- `/admin/products`
- `/admin/settings`

Logged-out users are redirected to `/admin/login`.

Admin-only API behavior:

- `GET /api/orders` requires an admin session.
- `PATCH /api/orders/[orderRef]` requires an admin session.
- `GET /api/products?scope=admin` requires an admin session.
- `GET /api/products?scope=deleted` requires an admin session.
- Product create, update, restore, soft delete, and permanent delete require an
  admin session.
- Draft product lookup through `/api/products/slug/[slug]?scope=admin` requires
  an admin session.

Public API behavior:

- `GET /api/products` returns only active, non-deleted products.
- `GET /api/products/slug/[slug]` returns only public product details.
- `POST /api/orders` remains public for checkout order creation and still runs
  Telegram notification after a successful save.
- `POST /api/orders/track` remains public but only returns a customer-safe
  order summary after matching order reference and phone number.

For local development only, if `ADMIN_USERNAME` and `ADMIN_PASSWORD` are not set
and `NODE_ENV` is not `production`, the app accepts the fallback credentials
`admin` / `admin`. Vercel production must use real environment variables.
