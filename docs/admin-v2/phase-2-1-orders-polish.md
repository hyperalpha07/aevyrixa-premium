# Phase 2.1 Orders Polish

## Scope

Phase 2.1 finalizes the existing Admin V2 Orders list and detail experience without redesigning Admin V2 or touching the old `/admin`, checkout UI, public website, customer account pages, or Supabase schema.

## Amount Calculation

The suspicious amount issue was real. Checkout displays payable amount as product subtotal plus selected delivery charge, but the current order creation path stores `totalAmount` as `input.totals.subtotal` and stores delivery separately in `deliveryCharge`.

Admin V2 now uses `lib/admin-v2/orders/order-amounts.ts`:

- `subtotal`: `order.totals.subtotal`, clamped to non-negative.
- `discount`: `null` because no real discount/coupon field exists.
- `deliveryCharge`: `order.deliveryCharge` when present.
- `total`: checkout payable `subtotal + deliveryCharge` when that conflicts with stored `order.totalAmount`.
- `paidAmount`: inferred only for verified payments.
- `dueAmount`: inferred only when paid amount is known.
- `refundAmount`: inferred only for refunded payments.
- `currency`: `SITE_CURRENCY` (`BDT`).

Stored totals are not overwritten. When stored total conflicts with checkout payable, detail UI documents the stored total and development logs emit a non-sensitive consistency warning.

## Item Normalization

`lib/admin-v2/orders/order-items.ts` normalizes item display fields: product name, product slug, product ID, image, SKU, variant, size, color, quantity, unit price, and line total.

Variant, size, and color are rendered as separate columns/fields. Missing values display an em dash and no longer fall back to each other.

## Images

Order item image values still pass through `normalizeAdminV2ImageSrc()`. Valid real images render through `next/image` with product alt text and `object-fit: cover`. Invalid image strings, visual theme names, colors, and empty values render a neutral package icon placeholder.

## Status Transitions

Status transition rules live in `lib/admin-v2/orders/order-status-transitions.ts`.

Allowed transitions:

- `Pending` -> `Confirmed`, `Cancelled`
- `Confirmed` -> `Shipped`, `Pending`, `Cancelled`
- `Shipped` -> `Delivered`, `Confirmed`, `Cancelled`
- `Delivered` -> `Shipped`
- `Cancelled` -> no next statuses

Sensitive transitions require a reason in the UI. Cancellation also requires a reason in the API.

## Notes

Real persistence exists only as the single `adminInternalNote` order field. Admin V2 allows saving that field through the existing order operations API. Multi-note history, authors, and note timestamps are not stored yet and are not simulated.

## Timeline

The timeline is built only from current stored order fields: order placed, payment confirmed, order confirmed, courier assigned, out for delivery, delivered, and cancelled when those states have evidence in the order record.

Detailed event history is not yet stored.

## Invoice / Order Summary

The print preview uses real Aevyrixa branding, order reference, order date, customer fields, item rows, payment fields, delivery fields, and normalized financial totals. It is labeled `Order Summary` because tax/VAT fields and invoice numbering do not exist.

Printing hides the Admin V2 shell and prints the summary on a white layout.

## Responsive Behavior

- Desktop/tablet item display uses a table with separate variant, size, color, SKU, quantity, unit price, and line total columns.
- SKU is hidden at narrower tablet widths.
- Mobile item display switches to labeled cards.
- List pagination clamps after filter changes so empty pages are avoided.
- Action menus stop event propagation and do not trigger row navigation.

## Remaining Backend Gaps

- Server-side order pagination/filtering/search.
- Dedicated discount/coupon fields.
- Dedicated paid, due, refunded amount fields.
- Durable `order_notes` history with author and timestamp.
- Durable `order_events` timeline/audit table.
- Courier provider assignment and tracking integrations.
- PDF invoice generation and invoice numbering.
