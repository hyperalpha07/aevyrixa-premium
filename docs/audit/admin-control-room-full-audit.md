# Aevyrixa Her Care Admin Control Room Full Audit

Audit date: June 2, 2026

Scope: audit only. No app code, styling, schema, migrations, Supabase data, or fallback data were changed.

## Active Route Map

The admin uses Next.js App Router split route wrappers. Each route checks `getAdminSession()`, validates section access with `canAccessSection()`, then renders the shared `AdminPanel` with a fixed `view` prop. The shell, sidebar, topbar, dashboard, and most page sections live in `app/admin/admin-panel.tsx`. Reviews and Settings delegate active content to separate components.

| Page | Active render location | Marker found | Notes |
|---|---|---|---|
| Dashboard / Control Room | `app/admin/page.tsx` -> `app/admin/admin-panel.tsx` with `view="dashboard"` | None | Active shell and dashboard are in `admin-panel.tsx`. |
| Orders | `app/admin/orders/page.tsx` -> `AdminPanel view="orders"` -> `OrdersSection` | None | Real active split route, content still in `admin-panel.tsx`. |
| Products | `app/admin/products/page.tsx` -> `AdminPanel view="products"` -> `ProductsSection` | None | Real product CRUD wired to API. |
| Reviews | `app/admin/reviews/page.tsx` -> `AdminPanel view="reviews"` -> `ReviewsCommandCenter` | Reviews Command Center, no requested V marker | Active content split into `reviews-command-center.tsx`. |
| Categories | `app/admin/categories/page.tsx` -> `AdminPanel view="categories"` -> `CategoriesSection` -> `CategoriesCommandCenter` | `CATEGORIES COMMAND V1 ACTIVE` | Active command center is in `admin-panel.tsx`; older form return below the first return is unreachable. |
| Customers | `app/admin/customers/page.tsx` -> `AdminPanel view="customers"` -> `CustomersSection` | `CUSTOMERS HUB V3 FIXED` | Active content is in `admin-panel.tsx`. |
| Support | `app/admin/support/page.tsx` -> `AdminPanel view="support"` -> `SupportSection` | None | Active content is in `admin-panel.tsx`; live/demo mode depends on API data. |
| Staff | `app/admin/staff/page.tsx` -> `AdminPanel view="staff"` -> `StaffSection` -> `StaffCommandCenter` | `STAFF COMMAND V1 ACTIVE` | Active command center is in `admin-panel.tsx`; older staff UI after return is unreachable. |
| Media | `app/admin/media/page.tsx` -> `AdminPanel view="media"` -> `MediaSection` | `MEDIA COMMAND V1 ACTIVE` | Mostly visual media vault; product editor upload is separate and real. |
| Discounts | `app/admin/discounts/page.tsx` -> `AdminPanel view="discounts"` -> `DiscountsSection` | `DISCOUNTS COMMAND V1 ACTIVE` | Fully visual/demo. |
| Analytics | `app/admin/analytics/page.tsx` -> `AdminPanel view="analytics"` -> `AnalyticsSection` | `ANALYTICS COMMAND V1 ACTIVE` | Partially derived from orders/products/reviews; most charts hardcoded. |
| Settings | `app/admin/settings/page.tsx` -> `AdminPanel view="settings"` -> `SettingsCommandSection` | `SETTINGS COMMAND V1 ACTIVE` | Active content split into `settings-command-section.tsx`. |
| Integrations | `app/admin/integrations/page.tsx` -> `AdminPanel view="integrations"` -> `IntegrationsSection` | `INTEGRATIONS HUB V1 ACTIVE` | Mostly visual, reads settings state for a few connection flags. |
| Billing | `app/admin/billing/page.tsx` -> `AdminPanel view="billing"` -> `BillingSection` -> `BillingFinanceConsoleContent` | `BILLING CONSOLE V1 ACTIVE` | Active console is visual-heavy; older billing return below the first return is unreachable. |

Navigation mechanism:

- Sidebar items are regular links, not in-memory tabs.
- Each route maps to a wrapper page under `app/admin/*/page.tsx`.
- The active state compares each sidebar item `view` to the `AdminPanel` `view` prop.
- Permission-gated visibility is handled by `canAccessSection()` and item-level permissions.

## Button / Action Audit

| Page | Section | Action/Button | Current behavior | Needed behavior | Missing page/modal/API? | Priority |
|---|---|---|---|---|---|---|
| Global shell | Sidebar | Dashboard, Orders, Products, Reviews, Categories, Customers, Support, Staff, Media, Discounts, Analytics, Settings, Integrations, Billing | Real navigation links gated by permissions | No action needed | No | P0 critical |
| Global shell | Topbar | Search / Enter | Searches visible nav labels and routes to matching admin page | Expand to real command palette and record search | Modal/search API optional | P2 polish |
| Global shell | Topbar | Notifications bell | Routes to support, reviews, or dashboard based on unread counts | Dedicated alerts drawer with alert types | New drawer | P1 important |
| Global shell | Topbar | Support icon | Link to `/admin/support` | No action needed | No | P0 critical |
| Global shell | Topbar | Mute/unmute | Real localStorage sound toggle with generated WebAudio tones | Add real sound assets or keep generated tones | Optional asset system | P3 future |
| Global shell | Rail | Store | Link to storefront `/` | No action needed | No | P0 critical |
| Global shell | Rail | Logout | Real `/api/admin/logout`, redirects to login | No action needed | No | P0 critical |
| Global shell | Rail | Coming soon / Aevyrixa Pro | Disabled visual-only | Help center/subscription page if productized | New page | P3 future |
| Dashboard | Range | Today / 7 days / 30 days / Month | Real local filter for dashboard metrics | Add custom date range picker UI | Optional date drawer | P2 polish |
| Dashboard | Order Operations | Status chip | Real status update if permission exists | Add confirmation for status changes | Confirmation modal | P1 important |
| Dashboard | Panels | View all orders / support / reviews / products / activity | Real navigation links | No action needed | No | P0 critical |
| Dashboard | Reviews mini actions | Approve / Hide / Reject | Navigation only to reviews page | Direct mutation or open review detail modal | API mutation or route context | P2 polish |
| Dashboard | QuickActionsPanel | Mixed dashboard shortcuts | Mostly links or disabled permission shortcuts | Link remaining staged actions | Modal/page by action | P2 polish |
| Orders | Header | Export CSV | Real CSV export of visible orders, permission gated | Add audit logging and PII export confirmation | Export utility/guard | P1 important |
| Orders | Filters | Search/selects/reset/filter | Real client filters | No action needed | No | P0 critical |
| Orders | Order cards | Expand/select | Real local detail expansion | No action needed | No | P0 critical |
| Orders | Details | Update status select | Real API/local mutation | Confirmation for cancel/refund-like statuses | Confirmation framework | P1 important |
| Orders | Customer info | Phone / WhatsApp | Real external links | No action needed | No | P0 critical |
| Orders | Order Notes | Create Note | Disabled/staged | Order note modal and mutation | New modal/API | P1 important |
| Orders | Support History | View all history | Disabled/staged | Link order to support conversations | New drawer/API | P1 important |
| Orders | Operations Controls | Save Operations | Real PATCH through order API | Add change summary confirmation for sensitive fields | Guard update | P1 important |
| Orders | Quick Actions | Confirm Order | Real status update | Add confirmation if status changes fulfillment | Confirmation modal | P1 important |
| Orders | Quick Actions | Cancel Order | Real status update with `window.confirm` | Branded modal with reason field | Confirmation modal | P1 important |
| Orders | Quick Actions | Mark Delivered | Real status update | Confirmation and timestamp audit | Confirmation/audit | P1 important |
| Orders | Quick Actions | Hold Order | Disabled/staged | Backend hold status or operational hold field | API/schema | P1 important |
| Orders | Quick Actions | Assign Courier | Scrolls to operations form | Acceptable; optional drawer | Optional drawer | P2 polish |
| Orders | Quick Actions | Print Invoice | Disabled/staged | Invoice template route and print/export utility | New page/API | P1 important |
| Orders | Quick Actions | Contact Customer | Real phone link when phone exists | Optional contact audit | Audit logging | P2 polish |
| Products | Filters | Category/search/status/stock/clear | Real client filters | No action needed | No | P0 critical |
| Products | Filters | Tags soon / More soon | Disabled/staged | Tag metadata and advanced filters | Schema/API optional | P2 polish |
| Products | Catalog | Add Product | Real inline editor | No action needed | No | P0 critical |
| Products | Product card | Select | Real selected product state | No action needed | No | P0 critical |
| Products | Product card | Edit | Real inline editor | No action needed | No | P0 critical |
| Products | Product card | Publish / Draft | Real API status update | Add confirmation for public visibility changes | Confirmation modal | P1 important |
| Products | Product card | Delete / Archive | Real API soft delete with `window.confirm` | Stronger confirmation with impact summary | Confirmation modal | P1 important |
| Products | Product card | Restore | Real API restore | Confirmation optional | Existing handler update | P2 polish |
| Products | Product card | Delete forever | Real permanent API delete with `prompt DELETE` | Owner approval/elevated guard | Approval system | P0 critical |
| Products | Quick actions | Add Product, Archive, Publish, Save Draft, Download | Real | Add guards for archive/publish/export | Confirmation/export guard | P1 important |
| Products | Quick actions | Duplicate soon / Bulk soon / Import soon | Disabled/staged | Duplicate modal, bulk upload, import workflow | Modal/API/upload utility | P1 important |
| Products | CMS workspace | Preview | Real storefront link | No action needed | No | P0 critical |
| Products | CMS workspace | Save Draft / Publish | Real status updates | Confirmation for public visibility changes | Confirmation modal | P1 important |
| Products | CMS workspace | More menu | Disabled/staged | Action menu | New menu | P2 polish |
| Products | CMS workspace | Upload / plus / color / inventory | Opens inline editor, not direct modal | Dedicated media/inventory drawer would be clearer | New drawer | P2 polish |
| Products | CMS tabs | General, Variants, Pricing, SEO, Shipping, Settings | Disabled except Media | Real tabbed editor surfaces | New components | P1 important |
| Reviews | Header | Review Queue | Visual-only button | Queue filter/action | Existing handler update | P2 polish |
| Reviews | Header | Export | Visual-only, no handler | CSV export with permission/audit | Export utility | P1 important |
| Reviews | Header | Add Review | Real modal + POST if `reviews.manage`; staged in demo | Add media upload integration if needed | Modal exists | P0 critical |
| Reviews | Filters | Search/product/rating/source/sort/status/view mode | Real client filters | No action needed | No | P0 critical |
| Reviews | Review list | Select review | Real selected review state | No action needed | No | P0 critical |
| Reviews | Detail | Approve / Hide / Reject | Real API in live mode; staged message in demo | Add confirmation for reject/hide | Confirmation modal | P1 important |
| Reviews | Detail | Edit | Real modal + PATCH in live mode; staged in demo | No action needed | No | P0 critical |
| Reviews | Detail | Delete Review | Real DELETE in live mode with `window.confirm`; staged in demo | Confirmation + reason/audit | Confirmation modal | P1 important |
| Reviews | Detail | View product | Real storefront link | No action needed | No | P0 critical |
| Reviews | Sidebar | View All | Disabled/staged | Full review activity/page | New page/drawer | P2 polish |
| Reviews | Bulk | Bulk Approve / Bulk Reject / Review Settings | Staged message only | Bulk selection, confirmation, API | New modal/API | P1 important |
| Categories | Header/filter/tree/cards | Tabs/search/type/more filters/tree/card menu/grid/list | Visual-only | Real category list, search, hierarchy reorder | Category table/API | P1 important |
| Categories | Editor | Name/slug/description/status/order | Real draft update for Comfort Panty only | Generalized selected category editor | State/model update | P1 important |
| Categories | Editor | Banner Upload icon | Visual-only | Category upload modal or shared media picker | Upload utility | P1 important |
| Categories | Editor | SEO Edit | Visual-only | SEO editor drawer | New drawer | P1 important |
| Categories | Editor | Assign Products Manage | Visual-only | Product assignment drawer | New drawer/API | P1 important |
| Categories | Quick actions | Publish Changes | Real settings save | Add storefront-impact confirmation | Confirmation modal | P1 important |
| Categories | Quick actions | Create/Duplicate/Reorder/Hide/Add Featured | Visual-only | Category CRUD/reorder framework | API/schema | P1 important |
| Customers | Header | Export | Real CSV export of displayed customers/demo | Add PII confirmation and audit | Export guard | P1 important |
| Customers | Segments | View all segments | Visual-only | Segment page/drawer | New drawer/page | P2 polish |
| Customers | Quick actions | View Orders | Real link to orders | Filter by selected customer | Query param/filter support | P1 important |
| Customers | Quick actions | Export Segment | Real CSV export | Add PII confirmation/audit | Export guard | P1 important |
| Customers | Quick actions | Message Customer | Disabled/staged | Message customer modal + outbound API | New modal/API | P1 important |
| Customers | Quick actions | Add Note | Disabled/staged | Customer note modal/API | New modal/API | P1 important |
| Customers | Detail | Profile Edit | Disabled/staged | Customer profile edit drawer | New drawer/API | P1 important |
| Customers | Detail | Wishlist View all | Disabled/staged | Wishlist detail drawer/API | New drawer/API | P2 polish |
| Customers | Detail | Account Activity View full log | Disabled/staged | Activity log page/drawer | New page/drawer | P2 polish |
| Customers | Detail | View Full Profile | Disabled/staged | Customer full profile drawer/page | New drawer/page | P1 important |
| Customers | Grid | Grid/list buttons and pagination | Visual-only | Real view mode and pagination | Existing handler update | P2 polish |
| Support | Inbox | Select ticket | Real local selection; live detail load for real tickets | No action needed | No | P0 critical |
| Support | Reply | Send | Real POST for non-demo with `support.reply` permission | Add template insertion, attachment upload | API for attachments/templates | P1 important |
| Support | Detail | Close Ticket / Resolve | Real status PATCH for real tickets; no confirmation | Confirmation and audit | Confirmation modal | P2 polish |
| Support | Detail | Escalate | Real status PATCH to pending only | Escalation modal with assignee/team/priority | New modal/API extension | P1 important |
| Support | Header | Date / Export | Visual-only | Date filtering and export | API/query/export | P1 important |
| Support | Inbox toolbar | Search / Filter / More | Visual-only icon buttons | Search/filter/action menu | Existing handler/API | P1 important |
| Support | Conversation | View Order | Visual-only | Link to order detail by order reference | Route/query support | P1 important |
| Support | Conversation | Internal Note | Visual tab only | Internal notes API | New API | P1 important |
| Support | Composer | Smile / attachment / image / file / tag | Visual-only icon buttons | Attachments, emoji, tagging | Upload/API | P2 polish |
| Support | Ticket details | Edit / add tag / attachments download | Visual-only | Ticket metadata and attachment system | New APIs | P1 important |
| Support | Channels | Manage / channel buttons | Visual-only | Channel settings page | New page/API | P2 polish |
| Support | Macros | Manage / macro buttons / Add New | Visual-only | Macro templates CRUD | New modal/API | P2 polish |
| Support | Activity | View all / View full activity log | Visual-only | Support activity log page | New page/API | P2 polish |
| Staff | Header | Date / Export | Visual-only | Staff export with audit | Export utility | P1 important |
| Staff | Team Members | Add | Real create draft start | No action needed | No | P0 critical |
| Staff | Team row name | Opens edit draft | Real | No action needed | No | P0 critical |
| Staff | Row three-dot | Real toggles active if can manage; label misleading | Replace with action menu | New menu | P1 important |
| Staff | Detail Editor | Save Changes | Real POST/PATCH | Confirmation for role/permission changes | Confirmation modal | P1 important |
| Staff | Permissions Matrix | Edit Roles | Visual-only | Role/permission matrix editor | New modal/API | P1 important |
| Staff | Activity Audit Log | View all / View full activity log | Visual-only | Full activity log page | New page | P2 polish |
| Staff | Detail Editor | Change Photo | Visual-only | Staff avatar upload | Upload utility/API | P2 polish |
| Staff | Invite | Send Invitation | Visual-only | Invitation API/email flow | New API | P1 important |
| Staff | Quick Role Templates | Template buttons | Visual-only | Apply template to draft or invite | Existing handler update | P2 polish |
| Staff | Approvals | Review | Visual-only | Approval request workflow | New page/API | P1 important |
| Staff | Security | Security Settings | Visual-only | Security settings page | New page/API | P1 important |
| Media | Header | Date / Export | Visual-only | Media export/report | Export/API | P2 polish |
| Media | Library | Search/filter/type/sort/view modes/pagination | Visual-only | Real media controls | Tables/API | P1 important |
| Media | Folders | Folder buttons, plus, New Collection | Visual-only | Folder/collection CRUD | Tables/API | P1 important |
| Media | Upload New Media | Add Files link | Links to products | Real media upload modal/library | Upload utility/storage table | P1 important |
| Media | Upload New Media | Drag/drop area | Visual-only | File picker/dropzone upload | Upload utility | P1 important |
| Media | Quick Actions | Upload Files / Optimize / Compress / Add Tags / Archive | Visual-only except permission disabled state | Batch media operations | API/jobs | P2 polish |
| Media | Cards | Three-dot menu | Visual-only | Asset action menu | New menu/API | P1 important |
| Media | Recent Uploads | View all | Visual-only | Upload history page/drawer | New page/API | P2 polish |
| Media | Details | Edit Metadata | Visual-only | Metadata drawer | New drawer/API | P1 important |
| Media | Usage | View full report | Visual-only | Usage report page | New page/API | P2 polish |
| Discounts | All sections | Date/export/search/filters/menus/view all/quick actions/generator/rules/save/clear/shop now | Visual-only | Discount campaigns/coupons/rules backend | Tables/APIs/modals | P1 important |
| Analytics | Header | Date/export | Date is visual, export no-op | Date range state and report export | Export/report API | P1 important |
| Analytics | Panels | View full report / View all campaigns / View retention analysis / report anchors | Mostly anchor links to `#analytics-report` | Drilldown report pages | New pages/APIs | P1 important |
| Analytics | Metrics/charts | Some derived values, mostly hardcoded | Analytics event pipeline | Analytics tables/API | P1 important |
| Settings | Store Profile | Save Changes | Real form submit to `/api/settings` | Add confirmation for sensitive settings | Confirmation guard | P1 important |
| Settings | Inputs | Store name/email/phone/address | Real draft updates | No action needed | No | P0 critical |
| Settings | Currency/timezone/sidebar/dashboard selects | Fixed no-op | Wire to settings or remove | Handler/API update | P2 polish |
| Settings | Toggles | Low stock and maintenance mode real; many others fixed/no-op | Wire all toggles to `AdminSettings` | Handler/API update | P1 important |
| Settings | Theme buttons/preview/test notification/add role/audit log | Visual-only | Settings sub-surfaces | New modals/pages | P1 important |
| Settings | Integrations overview | View All | Real link to integrations | No action needed | No | P0 critical |
| Settings | API key | Copy/refresh/regenerate | Visual-only | Secret vault/key rotation | API/approval | P0 critical |
| Settings | Webhooks | Manage Webhooks | Visual-only | Webhook manager | New page/API | P1 important |
| Settings | Billing | Manage Plan / View All / View Usage / Update | Visual-only | Billing/subscription pages | New pages/APIs | P1 important |
| Integrations | Header | Export | Visual-only | Integration report export | Export/API | P2 polish |
| Integrations | Connected Platforms | View All / Manage | Link to settings | Dedicated integration detail pages | New pages | P1 important |
| Integrations | API/Webhook Center | View Logs / row actions / Rotate Key | Visual-only | Logs, test, sync, copy, rotate key APIs | Pages/APIs/approval | P0 critical |
| Integrations | Activity | View All Activity | Visual-only | Integration activity log page | New page/API | P2 polish |
| Integrations | Automation | Toggles / Manage Flows / More menus | Visual-only | Automation workflow CRUD | New API/page | P1 important |
| Integrations | Quick Actions | Add Integration, Reconnect, Test Webhook, Import Config, Sync Now, Generate Report | Visual-only | Integration action framework | Modals/APIs | P1 important |
| Billing | Header/metrics/charts | Mostly visual; some order-derived metrics in setup | Replace with finance backend | Tables/APIs | P1 important |
| Billing | Transactions | View All Transactions | Visual-only | Transaction ledger page | New page/API | P1 important |
| Billing | Actions | Generate Invoice, Download Report, Tax Report, Export Data, Subscription | Visual card only | Finance suite pages/APIs | Pages/APIs/approval | P1 important |

## Real Data vs Fallback Data

| Page | Real tables used | Hardcoded/fallback sections | Missing tables/APIs | Recommendation |
|---|---|---|---|---|
| Dashboard | `orders`, `products`, `product_reviews`, `support_conversations`, `support_messages`, `admin_staff_activity_logs`, `store_settings` indirectly | Live visitors/system health, some CMS preview defaults | Dashboard analytics/events | Partially real. Keep as overview but mark fake operational metrics until analytics exists. |
| Orders | `orders` through `/api/orders` and `/api/orders/[orderRef]`; localStorage bridge | Browser `aevyrixa-draft-orders` fallback and demo-memory order store | Notes, invoice, support-order link, hold status | Partially real. Replace localStorage bridge after orders table is stable. |
| Products | `products`; fallback static products and demo-memory | Static seed products when Supabase unavailable | Tags, import/bulk jobs | Real data ready for core CRUD. |
| Reviews | `product_reviews`; demo reviews when no reviews | Demo counts/trends/activity in visual demo mode | Bulk moderation/export/settings | Partially real. Single-review workflows are live. |
| Categories | `store_settings.homepageMediaSettings` | Category counts/tree/cards mostly fake | Dedicated `categories`, product-category join | Mostly settings-backed, visually fake. Consider real category table. |
| Customers | `customer_accounts`, `customer_addresses`, `customer_sessions`, `orders` summary | If fewer than 9 records, entire hub uses demo customers; activity/recent orders/support are synthesized | Customer notes, profile details, messages, segments | Partially real but demo threshold masks live data. |
| Support | `support_conversations`, `support_messages` | Demo tickets/messages/macros/activity/channels when no real conversations; real ticket metadata still synthesized | Attachments, tags, macros, assignment/escalation, order link | Partially real. Reply/status are live. |
| Staff | `admin_staff`, `admin_staff_activity_logs` | Fallback staff/activity if backend empty; permission matrix visual | Invitations, photo upload, approvals/security settings | Partially real. Staff create/edit/toggle are live. |
| Media | Product media from `products`; homepage/category upload endpoint | Library counts/files/folders/storage/metadata hardcoded | `media_assets`, folders, tags, metadata, usage | Mostly visual/demo. |
| Discounts | None | All coupons/campaigns/rules/metrics hardcoded | `discount_campaigns`, `coupon_codes`, `discount_rules`, redemptions | Fully visual/demo. |
| Analytics | Uses loaded orders/products/reviews/support count for a few top values | Sessions, funnel, traffic, cohorts, geography, campaigns hardcoded | Event/session/analytics tables or provider API | Mostly fallback. |
| Settings | `store_settings`; localStorage fallback | Many system/API/billing/role metrics hardcoded | API keys/webhooks/roles/settings-specific tables | Partially real. |
| Integrations | `store_settings` for Telegram/WhatsApp/courier flags | Platform list, webhook rows, health/activity hardcoded | Integration registry, webhook logs, API key vault | Mostly visual/demo. |
| Billing | Loaded `orders` for some totals | Payment breakdown, transactions, expenses, profit hardcoded | invoices, transactions, refunds, expenses, subscriptions, tax reports | Mostly fallback. |

Known real Supabase-backed areas:

- `products`
- `orders`
- `product_reviews`
- `store_settings`
- `support_conversations`
- `support_messages`
- `customer_accounts`
- `customer_sessions`
- `customer_addresses`
- `admin_staff`
- `admin_staff_activity_logs`

Tables or API families strongly implied but missing:

- `categories`
- product/category assignment table
- `media_assets`
- media folders/collections/tags
- `discount_campaigns`
- `coupon_codes`
- `discount_rules`
- discount redemptions
- analytics sessions/events/search logs/cohorts
- integration registry
- webhook logs
- API key/secret vault
- invoices
- transactions
- refunds
- expenses
- tax reports
- customer notes/activity/messages
- support attachments/tags/macros/assignments

## Missing Pages / Modals / Drawers

| Missing surface | Triggered from | Type | Required data | Priority | Notes |
|---|---|---|---|---|---|
| Order detail/update modal or drawer | Order cards, quick actions | Drawer | `orders`, notes, status history | P1 important | Current inline detail is functional but dense. |
| Order notes modal | Create Note, Add Note | Modal | order notes table/API | P1 important | Needed before support/order history polish. |
| Invoice template/print page | Print Invoice, Billing Generate Invoice | Full page/API | orders, invoice numbering, tax | P1 important | Shared with Billing. |
| Product advanced editor tabs | CMS tabs | Drawer/tabs | `products` fields | P1 important | General, variants, pricing, SEO, shipping, settings. |
| Product duplicate/import/bulk upload | Quick actions | Modal/API | products, upload parser | P1 important | Needs confirmation for bulk changes. |
| Product inventory drawer | Manage Inventory, variants table | Drawer/API | product variants/stock fields | P1 important | Current variant rows are derived, not persisted variants. |
| Category CRUD/reorder/assignment | Category quick actions/editor | Drawer/API | categories/products join or settings extension | P1 important | Current editor only maps one visible category cleanly. |
| Category SEO editor | SEO Edit | Drawer | SEO metadata | P1 important | Needed before category pages become real. |
| Customer full profile | View Full Profile, profile card | Drawer/full page | customer account, addresses, orders, support, activity | P1 important | Also supports notes/messages. |
| Customer note/message | Message Customer, Add Note | Modal/API | customer notes, outbound messaging | P1 important | High privacy risk. |
| Customer segment manager | View all segments | Full page/drawer | customer scoring/segments | P2 polish | Current segments are calculated/demo. |
| Support assignment/escalation | Escalate, assignment panel | Modal/API | staff, support conversation fields | P1 important | Current status PATCH is too thin. |
| Support macros/templates | Manage, Add New | Modal/API | support templates table | P2 polish | Needed for agent workflow. |
| Support attachment manager | Composer/file icons, attachments | Drawer/API | support attachment storage | P2 polish | No upload/download backend visible. |
| Media upload/library/metadata | Media upload, edit metadata, card menu | Drawer/modal/API | storage asset table, folders, tags | P1 important | Product media upload exists but library does not. |
| Media usage report | View full report | Full page/API | media usage references | P2 polish | Useful after `media_assets` exists. |
| Discount campaign creator | Quick actions, coupons page | Modal/full page/API | campaigns, rules, schedule | P1 important | Entire Discounts page depends on this. |
| Coupon code generator | Generate Code | Modal/API | coupon codes, uniqueness, expiry, limits | P1 important | Visual inputs are not real inputs. |
| Discount rules builder | Save Rule, Add Condition | Full page/modal/API | rules engine | P1 important | Needs validation and storefront application. |
| Analytics report/export drilldowns | View full report/export | Full page/API | analytics provider/events | P1 important | Needed before trusting charts. |
| Integration settings/logs/key rotation | Manage, View Logs, Rotate Key, Sync Now | Full page/modal/API | integration registry, secrets, logs | P1 important | Must be guarded. |
| Staff role editor/invitation/security | Edit Roles, Send Invitation, Security Settings | Modal/API | staff roles, invitations, auth settings | P1 important | Staff CRUD exists; surrounding workflows staged. |
| Billing finance suite | Generate Invoice, Download Report, Tax Report, Subscription, Transactions | Pages/APIs | invoices, transactions, expenses, tax, subscription | P1 important | Current console is mostly visual. |

## Animation / 3D / Video / FX Audit

| Effect/System | Exists? | Where | Missing/Issue | Recommended implementation | Priority |
|---|---|---|---|---|---|
| Admin reveal/page entrance | Yes | `globals.css` admin animation classes | Not a route-level page transition for admin views | Shared `AdminPageTransition` wrapper | P2 polish |
| HUD/orb/radar backgrounds | Yes | `ControlRoomBackground`, orb stages, per-page decorative HUDs | Inconsistent per page | Shared `AdminHudBackground` | P1 important |
| Moving gradients/glow | Yes | CSS radial gradients, keyframes | Heavy one-off styles | Tokenized FX classes | P1 important |
| Particle/dot grid | Partial | Analytics map/dotted visuals | No global dot grid layer | Shared subtle grid component | P2 polish |
| Metric sparklines/charts | Yes | Dashboard, analytics, billing, integrations | Mostly static SVG and duplicate implementations | Shared sparkline/chart primitives | P1 important |
| Card hover lift/tilt | Partial | Hover borders/scale on product cards | No consistent lift/tilt system | `AdminInteractiveCard` | P2 polish |
| Neon border pulse | Partial | Live dots/glows | Not standardized | `LivePulse`/status primitives | P2 polish |
| Button microinteractions | Partial | Tailwind transitions, sound hooks | No press/loading states standard | `AdminButton` variants | P1 important |
| Modal/drawer transitions | Partial | Reviews modal only | No shared modal/drawer framework | `AdminModal`, `AdminDrawer` | P1 important |
| Sidebar active glow transition | Yes | `AdminNavItem` styling | Acceptable | Keep/refine | P2 polish |
| Background video support | Partial | Media/product previews render video | No admin background video system | Optional `AdminVideoBackdrop` | P3 future |
| Reduced motion | Yes globally | `prefers-reduced-motion` in CSS and animation components | Admin-specific FX not fully centralized | Add admin FX reduced-motion coverage | P1 important |
| Loading skeletons | Minimal | Loading text/spinners | No page skeleton system | Shared skeletons | P1 important |
| Empty-state animation | No | Static `NoDataState` | Needs subtle reusable empty state | `AdminEmptyState` | P2 polish |
| UI sound hooks | Yes | `useAdminSoundSystem` generated tones | Asset map empty | Add optional assets or leave muted default | P3 future |

## Design Consistency Audit

| Page | Design issues | Layout issues | Polish needed | Priority |
|---|---|---|---|---|
| Dashboard | Strongest consistency with shell | Dense but coherent | Standardize metric cards with other pages | P2 polish |
| Orders | Good operational density | Detail panel is very long | Drawer or split detail layout | P1 important |
| Products | Functional and polished | CMS tabs disabled but visible | Make disabled states explicit or build tabs | P1 important |
| Reviews | More self-contained style than other pages | Modal exists but not shared | Align controls with global admin button system | P2 polish |
| Categories | High visual fidelity but many fake counts | Editor only targets Comfort Panty | Separate real editor from visual overview | P1 important |
| Customers | Strong visual page, but source shows footer markup risk and demo masking | Demo threshold can mislead | Fix data truthfulness before polish | P1 important |
| Support | Dense four-column layout | Can overflow on medium screens | Simplify/right-panel hierarchy | P2 polish |
| Staff | Very dense tables and panels | Fallback 48 staff count conflicts with data | Clarify real vs fallback state | P1 important |
| Media | Looks complete but mostly staged | Upload area is not real | Build real library before polishing visuals | P1 important |
| Discounts | Strong visual consistency | Entirely demo | Backend first | P1 important |
| Analytics | Rich charts | Static metrics mixed with live values | Label derived vs fake or replace | P1 important |
| Settings | Uses separate style scale | Many no-op controls | Wire controls and normalize button styles | P1 important |
| Integrations | Visually strong | API/key controls are fake | Guarded backend first | P1 important |
| Billing | High visual impact | Hardcoded currency text has encoding artifacts in source | Replace fake finance data and encoding artifacts | P1 important |

## Security / Risk Audit

| Page | Risky action | Current guard | Required guard | Priority |
|---|---|---|---|---|
| Orders | Export CSV with customer/order PII | Permission only | Confirmation + audit log | P1 important |
| Orders | Cancel order | `window.confirm` | Branded modal + reason field | P1 important |
| Orders | Status/payment/courier changes | Permission only | Confirmation for sensitive status/payment changes | P1 important |
| Orders | Contact customer | External link only | Optional audit/log intent | P2 polish |
| Products | Delete/archive | `window.confirm` | Confirmation with impact summary | P1 important |
| Products | Permanent delete | `prompt DELETE` | Owner approval or elevated confirmation | P0 critical |
| Products | Publish/draft | Permission only | Confirmation for publish/unpublish | P1 important |
| Reviews | Delete review | `window.confirm` | Confirmation + audit reason | P1 important |
| Reviews | Bulk approve/reject | Staged | Bulk confirmation + preview | P1 important |
| Categories | Publish/hide/reorder | Permission only or staged | Confirmation for storefront changes | P1 important |
| Customers | Export customer segment | No confirmation | PII export confirmation + audit | P0 critical |
| Customers | Message customer | Staged | Consent/approval + audit | P1 important |
| Support | Send reply | Permission + disabled for demo | Audit and optional template preview | P1 important |
| Support | Close/escalate/resolve | Permission only | Confirmation for close/escalate | P2 polish |
| Staff | Role/permission changes | Permission only | Owner/admin approval, diff summary | P0 critical |
| Staff | Deactivate staff | Permission only via three-dot | Confirmation | P1 important |
| Settings | Sensitive settings/payment/courier/webhook | API permission diff exists | Add UI confirmation/diff | P1 important |
| Integrations | Rotate key/connect/sync | Staged | Owner approval + secret handling | P0 critical |
| Billing | Finance exports/invoices/refunds/subscription | Staged | Owner approval + audit | P0 critical |
| Media | Archive/delete/bulk operations | Staged | Confirmation + undo window | P1 important |

## Recommended Implementation Roadmap

| Phase | Goal | Files likely touched | Expected risk | Suggested order | Build/test command |
|---|---|---|---|---|---|
| Phase 1: Global admin motion/FX system | Centralize HUD, transitions, reduced motion, skeletons | `app/globals.css`, `app/admin/admin-panel.tsx`, new admin UI primitives | Medium | Build shared FX wrappers before page polish | `npm run build` |
| Phase 2: Shared modal/drawer/action framework | Replace ad hoc confirms and staged buttons | new `app/admin/components/*`, `admin-panel.tsx`, reviews/settings components | Medium | Modal, drawer, confirmation, action menu, toast | `npm run build` |
| Phase 3: Real data replacement and fallback removal | Remove misleading demo thresholds/page fake metrics | libs/API routes/admin sections | Risky | Start with customers, media, discounts, analytics, billing | `npm run build` plus API smoke tests |
| Phase 4: Button linkup page by page | Wire real handlers for existing buttons | each admin section | Medium | Orders -> Products -> Reviews -> Staff -> Support -> Settings | `npm run build` |
| Phase 5: Missing page/modal build | Add detail/profile/invoice/media/discount/integration/billing surfaces | new routes and components | Medium/high | Build highest-value drawers first | `npm run build` |
| Phase 6: Security confirmation/approval system | Guard destructive/private/export actions | auth/permissions/admin UI/API logs | High | Add audit log + confirmation diff before enabling risky actions | `npm run build` |
| Phase 7: Final visual polish | Normalize spacing, buttons, cards, tables, footers | CSS/admin components | Low/medium | After live data is connected | `npm run build` |
| Phase 8: Production QA | Verify permissions, fallbacks, mobile overflow, export privacy | all admin routes | Medium | Role matrix tests, route tests, visual pass | `npm run build`; manual admin smoke |

## First 5 Implementation Tasks to Do Next

1. Build shared `AdminConfirmModal`, `AdminDrawer`, `AdminActionMenu`, `AdminButton`, and `AdminToast` primitives.
2. Replace `window.confirm` / `window.prompt` for product delete, permanent delete, review delete, and order cancel.
3. Build the customer full profile drawer and remove the `customers.length < 9` demo override so live records are not masked.
4. Build order notes + invoice template surfaces because multiple buttons already depend on them.
5. Create a real media asset model/API and wire Media Library upload, metadata edit, folders, tags, and archive before polishing the media page.
