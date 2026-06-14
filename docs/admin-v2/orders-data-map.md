# Admin V2 Orders Data Map

## Actual Order Source

Admin V2 reads orders through `app/lib/order-store.ts`. Real orders come from the Supabase `orders` table through the REST API when both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured.

`demo-memory` storage is intentionally hidden from Admin V2 order pages and dashboard summaries.

## Reused Endpoints And Store Functions

- `GET /api/orders`: existing admin-protected order list endpoint using `listOrders()`.
- `PATCH /api/orders/[orderRef]`: existing admin-protected order operations endpoint using `updateOrderOperations()`.
- `getOrderByReference(orderRef)`: reused directly in the Admin V2 server route for detail loading.
- `listOrders()`: reused directly in the Admin V2 server route for list loading.

## Order List Response Shape

`GET /api/orders` returns:

- `orders: OrderRecord[]`
- `storageMode: "supabase" | "demo-memory"`

Admin V2 displays only `storageMode === "supabase"` records that are not archived, deleted, or soft-deleted.

The current Supabase query returns `select=*`, ordered by `created_at.desc`, limited to 100 rows. Server-side filters and cursor pagination are not implemented yet.

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

`updated_at` exists in the Supabase row mapper input but is not currently exposed on `OrderRecord`, so Admin V2 does not display a last-updated timestamp.

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
- slug
- name
- price
- image
- size
- color
- absorbency
- variant
- quantity

## Product Image Mapping

Order item images come from the serialized checkout/cart `items[].image` field stored in the Supabase `orders.items` JSON payload. Product catalog image data lives separately on product records as `primary_image_url`, `image_url`, `primary_image_path`, `images`, and `media` in `app/lib/product-store.ts`; the current order row does not join products during detail rendering.

The bad Admin V2 crash was caused by old/public cart payloads that put the product visual theme slug, for example `blush-violet`, into `items[].image`. That value is a theme/variant identifier, not an image URL. The order ingestion and read mappers now normalize `items[].image` through `normalizeAdminV2ImageSrc()` and keep visual data separate in `visualTheme`, `visualVariant`, `color`, `variant`, `size`, and `productId`.

Valid image values are preserved when they are root-relative paths, absolute `http`/`https` URLs, or path-like product-media object paths that can be converted to the existing Supabase public storage URL. Plain labels, color/theme slugs, malformed URLs, unsafe protocols, and empty strings become `null`.

When an order record genuinely has no valid product image, Admin V2 renders a neutral rounded product avatar using the item initial. It does not substitute fake product photography and does not pass the missing or invalid value to `next/image`.

Known no-image cases:

- Static fallback products have visual themes but no real `imageUrl` by default.
- Existing orders whose `items[].image` is `blush-violet`, `cyan-night`, `rose-gold`, a color label, or another plain text value are treated as no-image records.

## Fields Unavailable In Current Backend

- Full order event history with per-event timestamps.
- Last-updated timestamp in `OrderRecord`.
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
- Cancel order with required reason where state allows.
- Save internal note to the existing `adminInternalNote` field.
- Print browser invoice/order summary from real order data.
- CSV export of the filtered result set, with confirmation before including customer PII.

## Actions Staged For Later Phases

- Dedicated server-side CSV export endpoint with audit trail.
- Multi-note order history table/API.
- Real timeline/event table.
- Server-side pagination, filtering, and search.
- Courier provider assignment and tracking integration.
- PDF invoice generation.
- Customer detail deep-link once Admin V2 customer detail is fully implemented for order customers.
