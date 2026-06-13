# Aevyrixa Admin V2 Architecture Blueprint

## Reference

Aevyrixa Admin V2 uses the free Materio TypeScript template as a structural and UX reference only:

- Reference ZIP: `docs/reference/materio/materio-mui-nextjs-admin-template-free-main.zip`
- Extracted TypeScript reference: `.materio-reference/materio-mui-nextjs-admin-template-free-main/typescript-version/`

No paid Materio package code is used.

## Folder Structure

Admin V2 is isolated from the current `/admin` implementation.

- `app/admin-v2/`: protected route segment, layout, dashboard, and route-safe placeholder pages.
- `components/admin-v2/core/`: client shell, theme provider, command palette, notification drawer.
- `components/admin-v2/layouts/`: sidebar, topbar, logo, footer, content frame.
- `components/admin-v2/navigation/`: active route and menu rendering helpers.
- `components/admin-v2/shared/`: reusable card, button, chip, empty state, page header, breadcrumbs.
- `components/admin-v2/forms/`: inputs, selects, tabs, dialogs, drawers.
- `components/admin-v2/tables/`: table shell primitives.
- `components/admin-v2/charts/`: chart placeholders and future chart wrapper location.
- `components/admin-v2/views/`: dashboard and placeholder module views.
- `configs/admin-v2/`: navigation, routes, permissions, and theme tokens.
- `lib/admin-v2/`: auth adapters, permission route mapping, data adapters, and shared types.

## Shell Structure

`app/admin-v2/layout.tsx` is a server layout that:

- calls the existing `getAdminSession()`;
- redirects unauthenticated users to `/admin/login?next=/admin-v2`;
- passes the verified session into the client Admin V2 shell.

`AdminV2Shell` provides:

- persistent desktop sidebar;
- collapsible desktop sidebar;
- mobile/tablet drawer sidebar;
- top navbar;
- scoped MUI theme provider;
- command palette;
- notification drawer;
- content region and footer.

## Navigation Structure

Navigation is data-driven from `configs/admin-v2/navigation.ts`.

Entries support:

- section headings;
- icons from `lucide-react`;
- badges;
- nested children;
- permission or section visibility checks;
- route-aware active states.

The root `/admin-v2` redirects to `/admin-v2/dashboard`.

## Theme Architecture

Admin V2 uses MUI for the admin route only.

Theme state supports:

- light, dark, and system mode;
- Aevyrixa magenta/purple primary token;
- soft violet secondary token;
- emerald, amber, rose, and cyan semantic states;
- configurable border radius;
- configurable content width;
- configurable navigation style;
- local persistence in `localStorage`.

The theme provider is scoped under `/admin-v2`, so the storefront and current `/admin` are not migrated to MUI.

## Data Layer

`lib/admin-v2/data.ts` wraps existing Aevyrixa data stores:

- `listOrders()` for real Supabase orders only;
- `listProducts()` for real/fallback catalog products;
- `listAllReviews()` only when Supabase review configuration exists;
- `listAdminCustomerOverviews()` when customer account storage is available;
- support conversations when available.

Existing demo-memory order/review fallbacks are not surfaced as Admin V2 business metrics.

## Authentication Layer

Admin V2 reuses:

- `getAdminSession()`;
- `ADMIN_SESSION_COOKIE`;
- `/api/admin/logout`;
- existing admin login at `/admin/login`.

No second auth system is introduced.

## Permissions Layer

Admin V2 maps planned modules to existing `AdminSection` and `AdminPermission` values in `configs/admin-v2/permissions.ts`.

Routes call `requireAdminV2RouteAccess()` where a section gate is available. Modules without a precise current permission are mapped to the nearest conservative existing section, usually settings, analytics, orders, support, or staff.

## Modal and Drawer Architecture

Dialogs and drawers use shared MUI wrappers:

- `V2Dialog`;
- `V2Drawer`;
- command palette dialog;
- notification drawer.

All modal surfaces are owned by the Admin V2 shell and can be reused by later modules.

## Form Architecture

Form primitives live in `components/admin-v2/forms/`:

- `V2Input`;
- `V2Select`;
- `V2Tabs`;
- dialog/drawer wrappers for edit flows.

Phase 1 creates styling and structure only. Later phases should connect forms to existing admin APIs.

## Table Architecture

`V2TableShell` wraps MUI table components with consistent density, empty states, and overflow behavior.

Phase 1 uses it for recent orders. Later modules should add filtering, pagination, row actions, and permission-aware mutation controls.

## Chart Architecture

Phase 1 avoids adding chart dependencies. Metric cards and simple summary surfaces are used instead.

If Phase 2 needs charts, add a scoped chart wrapper in `components/admin-v2/charts/` after validating compatibility with Next 16 and React 19.

## Notification Architecture

The notification drawer reads real available counts when safe:

- pending orders from real Supabase order data;
- pending reviews only when Supabase reviews are configured;
- open support conversations when available.

If data is unavailable, it shows an empty/pending-connection state.

## Responsive Strategy

The shell uses MUI breakpoints:

- desktop: fixed sidebar with collapsible width;
- tablet/mobile: temporary drawer;
- content has constrained max width and independent overflow;
- topbar stays visible and provides drawer trigger on small screens.

## Migration Strategy

Phase 1 creates a protected foundation and route map. It does not replace `/admin`.

Later phases should migrate one workflow at a time:

1. Orders and order detail.
2. Products and media.
3. Customers and support.
4. Settings and permissions.
5. Analytics and finance.

Each migrated module should keep the old `/admin` route operational until verified.
