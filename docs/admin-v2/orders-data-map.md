# Admin V2 Orders Data Map

## Actual Order Source

Admin V2 reads orders through `app/lib/order-store.ts`. Real orders come from the Supabase `orders` table through the REST API when both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured.

`demo-memory` storage is intentionally hidden from Admin V2 order pages and dashboard summaries.

## Reused Endpoints And Store Functions

- `GET /api/orders`: admin-protected server-side query endpoint using `queryOrders()`.
- `PATCH /api/orders/[orderRef]`: admin-protected order operations endpoint. Status transitions use the atomic status/event RPC after the Phase 2.2 migration.
- `GET /api/orders/[orderRef]/notes` and `POST /api/orders/[orderRef]/notes`: durable order notes.
- `GET /api/orders/[orderRef]/events`: durable timeline events.
- `GET /api/orders/[orderRef]/invoices` and `POST /api/orders/[orderRef]/invoices`: persistent invoice records.
- `getOrderByReference(orderRef)`: reused directly in the Admin V2 server route for detail loading.
- `queryOrders(query)`: reused directly in the Admin V2 server route for list loading.

## Order List Response Shape

`GET /api/orders` returns:

- `rows: OrderRecord[]`
- `totalCount`
- `page`
- `pageSize`
- `totalPages`
- `appliedFilters`
- `storageMode: "supabase" | "demo-memory"`

Admin V2 displays only `storageMode === "supabase"` records that are not archived, deleted, or soft-deleted.

The Supabase query supports server-side search, filters, sort, count, and range pagination. Page size is capped by the parser.

## Order Detail Shape

The detail page uses `OrderRecord` from `app/lib/order-types.ts`:

- `orderId`
- `orderReference`
- `customerId`
- `customer`
- `paymentDetails`
- `items`
- `totals`
- `totalAmount`
- `status`
- `createdAt`
- optional courier, tracking, payment, delivery, note, source, archive, deletion, and cancellation fields

`updated_at` is exposed as `updatedAt` when the Supabase row provides it. Admin V2 displays it only when present.

## Amount Mapping

Discovered fields:

- Item subtotal/product subtotal: `orders.subtotal` mapped to `order.totals.subtotal`.
- Delivery charge: `orders.delivery_charge` mapped to `order.deliveryCharge`.
- Stored total: `orders.total` or legacy `total_amount` mapped to `order.totalAmount`.
- Currency: app constant `SITE_CURRENCY`, currently `BDT`.
- Discount/coupon discount: no dedicated persisted field was found in the current order schema, checkout payload, order types, or admin mapper.
- Paid amount, due amount, refund amount: no dedicated persisted amount fields were found.

Checkout displays total payable as product subtotal minus discount plus selected delivery charge. No dedicated discount field exists in the current payload/schema, so the current persisted calculation is `subtotal + deliveryCharge`.

The write-path bug was in `app/lib/order-store.ts`: `buildOrder()` previously set `totalAmount` to `input.totals.subtotal`, dropping `input.deliveryCharge` before `orderToSupabaseInsertPayload()` wrote `orders.total`. New orders now calculate `totalAmount` through `calculateAdminV2PayableTotal({ subtotal, discount: null, deliveryCharge })`.

Canonical total going forward: `orders.total` / `OrderRecord.totalAmount` stores the checkout payable total. `orders.subtotal` / `OrderRecord.totals.subtotal` remains the item subtotal, and `orders.delivery_charge` / `OrderRecord.deliveryCharge` remains the delivery fee.

Historical rows are not overwritten or backfilled. Admin V2 displays `Discount` as `Not provided` unless a real field exists, and uses checkout payable (`subtotal + deliveryCharge`) as the visible total only when it conflicts with the stored total. The concise mismatch banner appears only for real stored-total/payable-total differences and disappears automatically for consistent rows. In development, Admin V2 logs a non-sensitive consistency warning.

Phase 2.2 adds explicit `discount_amount`, `paid_amount`, `due_amount`, `refunded_amount`, `currency_code`, and `payment_verified_at` fields. Existing `subtotal`, `total`, and `delivery_charge` remain canonical for subtotal, payable total, and delivery amount.

## Durable Phase 2.2 Tables

- `order_notes`: one row per real note, keyed by `order_ref`, with type, actor, timestamps, and optional soft delete.
- `order_events`: append-only order timeline, keyed by `order_ref`.
- `invoices`: issued invoice records, keyed by `order_ref`, with a stable JSON snapshot and unique invoice number.

## Real Status Values

Order status:

- `Pending`
- `Confirmed`
- `Shipped`
- `Delivered`
- `Cancelled`

Payment status:

- `pending`
- `verified`
- `failed`
- `refunded`

Payment verification status:

- `Pending`
- `Verified`
- `Failed`
- `Not Required`

Delivery status:

- `pending`
- `processing`
- `packed`
- `dispatched`
- `in_transit`
- `delivered`
- `failed`
- `returned`

## Available Fields

Customer fields:

- name
- phone
- email
- city or area
- delivery address
- size/fit note
- delivery note
- customer ID when checkout was linked to an account

Payment fields:

- method
- wallet provider
- payment type
- receiver number
- sender number
- transaction reference
- payment status
- payment verification status
- payment reference
- payment note

Payment display rules:

- Payment status uses real `payment_status` when present.
- If `payment_status` is missing and `payment_method` is definitely `Cash on Delivery`, Admin V2 displays `Pay on Delivery`.
- Otherwise missing payment status displays `Not provided`.
- Verification uses only `payment_verification_status`.
- Paid, due, and refund amounts display `Not provided` because there are no dedicated stored amount fields.

Delivery fields:

- courier name
- tracking ID
- delivery status
- delivery charge
- delivery area
- delivery zone
- delivery note

Item fields:

- product ID
- SKU when present in JSON
- slug
- name
- price
- image
- size
- color
- absorbency
- variant
- quantity
- line total when present in JSON; otherwise Admin V2 calculates `price * quantity` for display

Variant display is normalized in the Admin V2 presentation layer only. If `items[].variant` is a combined legacy value such as `S / Black / Moderate` and separate selected size/color fields are present, Admin V2 removes only matching size and color tokens and displays `Moderate` as the variant. The raw stored JSON is unchanged. If size/color are unavailable, the original variant string is preserved. If no variant remains, Admin V2 displays an em dash.

Delivery note display is also presentation-only. Delivery zone is shown in Delivery Details from `delivery_zone`. Admin V2 does not synthesize delivery notes from zone or area, and it suppresses legacy note tokens like `Zone: Inside Dhaka`. A real delivery note displays in Order Notes; otherwise it displays `Not provided`.

## Product Image Mapping

Order item images come from the serialized checkout/cart `items[].image` field stored in the Supabase `orders.items` JSON payload. Product catalog image data lives separately on product records as `primary_image_url`, `image_url`, `primary_image_path`, `images`, and `media` in `app/lib/product-store.ts`; the current order row does not join products during detail rendering.

The bad Admin V2 crash was caused by old/public cart payloads that put the product visual theme slug, for example `blush-violet`, into `items[].image`. That value is a theme/variant identifier, not an image URL. The order ingestion and read mappers now normalize `items[].image` through `normalizeAdminV2ImageSrc()` and keep visual data separate in `visualTheme`, `visualVariant`, `color`, `variant`, `size`, and `productId`.

Valid image values are preserved when they are root-relative paths, absolute `http`/`https` URLs, or path-like product-media object paths that can be converted to the existing Supabase public storage URL. Plain labels, color/theme slugs, malformed URLs, unsafe protocols, and empty strings become `null`.

When an order record genuinely has no valid product image, Admin V2 renders a neutral rounded product avatar with a package icon. It does not substitute fake product photography and does not pass the missing or invalid value to `next/image`.

Known no-image cases:

- Static fallback products have visual themes but no real `imageUrl` by default.
- Existing orders whose `items[].image` is `blush-violet`, `cyan-night`, `rose-gold`, a color label, or another plain text value are treated as no-image records.

## Fields Unavailable In Current Backend

- Full order event history with per-event timestamps.
- Dedicated discount/coupon fields.
- Dedicated paid, due, and refunded amount fields.
- Persistent multi-note history with author and created timestamp.
- Tax fields.
- PDF invoice generation.
- Server-side export endpoint.
- Server-side order list pagination and filters.
- Courier integration status beyond manually stored courier/tracking fields.

## Backend-Supported Actions

Through `PATCH /api/orders/[orderRef]`:

- order status update
- courier/tracking update fields
- delivery status and delivery metadata update fields
- payment status/reference/note update fields
- payment verification status update
- internal admin note update
- order source and assigned staff update
- test/archive/delete marker fields when permissions allow
- cancellation reason field

Permissions are enforced in the existing API:

- `orders.editStatus`
- `orders.editCourier`
- `orders.archiveTest`

## Admin V2 Implemented Actions

- View real order list.
- Filter the authorized loaded result set.
- Sort the authorized loaded result set.
- Local pagination over the loaded result set.
- View real order detail.
- Update valid next order status.
- Cancel order with required reason where state allows. Invalid transitions are blocked in the UI and by `PATCH /api/orders/[orderRef]`.
- Save internal note to the existing `adminInternalNote` field.
- Print browser order summary from real order data. It does not show fake tax/VAT or fake invoice numbers.
- Back from detail returns to `/admin-v2/orders` and preserves current filter query parameters when the detail page was opened from a filtered list.
- Refresh calls `router.refresh()` with loading feedback and keeps the current route/query.
- Detail/list action clicks stop unrelated table navigation.
- CSV export of the filtered result set, with confirmation before including customer PII.

## Actions Staged For Later Phases

- Dedicated server-side CSV export endpoint with audit trail.
- Multi-note order history table/API.
- Real timeline/event table.
- Server-side pagination, filtering, and search.
- Courier provider assignment and tracking integration.
- PDF invoice generation.
- Customer detail deep-link once Admin V2 customer detail is fully implemented for order customers.
