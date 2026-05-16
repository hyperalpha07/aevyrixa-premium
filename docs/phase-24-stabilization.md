# Phase 24 — QA & Stabilization

## What was fixed

### 1. Product media create bug (product-store.ts)
`toSupabaseCreatePayload` was missing `video_url`. All three media fields are now consistent between create and update payloads: `image_url`, `video_url`, `poster_url`.

### 2. Admin product media fields (admin-panel.tsx)
Added `imageUrl`, `videoUrl`, `posterUrl` fields to:
- `AdminProduct` type
- `emptyProduct` defaults
- `normalizeAdminProduct` (localStorage restore)
- `productSeed` (static seed)
- `productToApiPayload` (sent to Supabase on save)
- `apiProductToAdminProduct` (mapped from Supabase on load)
- `ProductEditor` form (Image URL, Video URL, Poster URL text fields)

### 3. Product slug lookup optimized (product-store.ts)
`getProductBySlug` now uses a direct Supabase query (`slug=eq.{value}&deleted_at=is.null&limit=1`) instead of fetching all products. Falls back to static/demo products if Supabase is unavailable.

### 4. Checkout localStorage draft-order writes removed (checkout/page.tsx)
`saveDraftOrder` function and its call after successful Supabase order save were removed. Supabase is now the sole source of truth for orders. The order success panel (ConfirmationPanel) reads from React state, not localStorage, so it is unaffected.

### 5. Visual theme fallback warning (product-store.ts)
`normalizeVisual` now emits a `console.warn` in `NODE_ENV=development` when an unknown theme value is received, before falling back to `blush-violet`. No crash, no change to fallback behavior in production.

### 6. System version label updated (admin-settings.ts)
Default `systemVersionLabel` changed from `"Phase 21"` to `"Aevyrixa Control Room — Phase 24 Stabilized"`. A user-saved Supabase value is not overwritten (the default only applies when no saved value exists).

### 7. Orders list default limit (order-store.ts)
`listOrdersFromSupabase` now fetches newest first with a default limit of 100 rows. A TODO comment marks the hook for full pagination when order volume requires it. Products list has a TODO comment for future pagination; current fetch remains unbounded until the catalog grows.

---

## How to test product media fields

1. Go to Admin → Products → Add product (or edit an existing one).
2. Fill in Image URL, Video URL, Poster URL fields with valid HTTPS URLs.
3. Save. Reload the admin panel and verify the fields retain their values.
4. On the storefront product page, verify the image renders if `imageUrl` is set.

## How to test product slug pages

1. In Admin → Products, note the slug of an active product.
2. Visit `/products/{slug}` on the storefront and confirm the page loads.
3. Try a non-existent slug — expect a 404 or "not found" state.
4. Disconnect Supabase env vars locally, restart — confirm static fallback products load.

## How to test checkout / order / Telegram / tracking

1. Add a product to cart, proceed to checkout, submit a real test order.
2. Confirm the order success (ConfirmationPanel) appears with the correct order reference.
3. Check admin orders panel — the new order should appear (sourced from Supabase).
4. Check Telegram — a new order notification should arrive.
5. Visit `/track-order`, enter the order reference — tracking should resolve.
6. In admin, update the order status — confirm the status change persists.

## How to test fallback product loading

1. Remove `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from your local `.env`.
2. Restart the dev server.
3. Visit the shop page — static/demo products should load without errors.
4. Visit `/products/{static-slug}` — product detail page should render.
5. The console should log `Product source: demo-memory` or `fallback-static`.

---

## Known future work

- **Category architecture** — product categories are free-text strings; a structured category system (with slugs and display names) is needed for browse/filter pages.
- **Brand repositioning** — hero copy, product descriptions, and SEO metadata need a full copy review.
- **Admin panel component split** — `admin-panel.tsx` is a monolith; split into ProductsSection, OrdersSection, SettingsSection, DashboardSection as separate files.
- **Full pagination UI** — products and orders lists need page/cursor controls once row counts exceed the safe defaults.
- **File upload for media** — current media fields are URL-only; a Supabase Storage upload flow is needed for self-hosted product images.
