# Phase 2 Orders Implementation

## Architecture Summary

Admin V2 Orders uses Server Components for authenticated data loading and Client Components for filtering, pagination, table rendering, dialogs, export, printing, and mutations.

Server routes:

- `/admin-v2/orders`
- `/admin-v2/orders/[orderRef]`

Client modules live under:

- `components/admin-v2/views/orders`
- `components/admin-v2/views/orders/detail`

The data helper `lib/admin-v2/orders.ts` wraps existing order store functions and hides demo-memory records.

## Security Behavior

- Routes call `requireAdminV2Session()`.
- Routes call `requireAdminV2RouteAccess()` for the Orders module.
- Action buttons are gated by existing permission booleans.
- Mutations still go through `PATCH /api/orders/[orderRef]`, which enforces permissions server-side.
- PII export requires confirmation before customer details are included.
- No payment secrets or card data are displayed or exported.

## Filters And Pagination

The current backend returns the latest 100 Supabase orders without server-side filters. Admin V2 applies filters, sorting, and pagination locally over the authorized loaded result set.

Implemented filters:

- search by order reference, customer name, customer phone, and customer email when present
- order status
- payment method
- payment status
- delivery status
- date range
- sort newest, oldest, highest total, lowest total

URL query parameters are synchronized for safe filter state:

- `q`
- `status`
- `payment`
- `paymentStatus`
- `delivery`
- `from`
- `to`
- `sort`
- `page`

## Supported Actions

- Refresh route data.
- Export filtered CSV.
- View order details.
- Update status with valid next states only.
- Cancel eligible orders with required reason.
- Save an internal note to the existing single note field.
- Open and print a real order invoice/order summary.

## Unsupported Backend Features

- Persistent note history.
- Detailed lifecycle event table.
- Last-updated timestamp in the normalized order type.
- Server-side export job or audit-specific export endpoint.
- Server-side pagination and filtering.
- PDF invoice creation.

## Invoice Behavior

The invoice preview is browser-printable and uses only real order fields:

- Aevyrixa branding
- order reference
- order date
- customer details
- item list
- subtotal
- discount when derivable
- delivery fee
- total
- payment method
- payment status

It is labeled as an order invoice and does not imply tax data.

## Known Limitations

- Local pagination is limited to the backend's current 100-row Supabase list query.
- Status history uses current order fields and clearly labels that detailed event history is not stored.
- Notes persistence is limited to `adminInternalNote`.
- Customer deep links are not added from the order detail because Admin V2 customer detail behavior is still scaffolded.

## Recommended Next Improvements

- Add server-side order pagination, search, and filters to `listOrdersFromSupabase`.
- Expose `updated_at` in `OrderRecord`.
- Add an `order_notes` table/API for durable note history with author and timestamps.
- Add an `order_events` table/API for lifecycle timeline.
- Add audited server-side CSV export.
- Add courier assignment/tracking integrations.
