# Admin V2 Orders API Reference

## Orders

`GET /api/orders` requires `orders.view`.

Query params: `q`, `status`, `payment`, `paymentStatus`, `delivery`, `from`, `to`, `sort`, `page`, `pageSize`.

Response: `rows`, `totalCount`, `page`, `pageSize`, `totalPages`, `appliedFilters`, `storageMode`.

`PATCH /api/orders/[orderRef]` requires server-side admin authorization. Status transitions use `admin_v2_update_order_status_with_event` after migration so status and event are committed together.

## Notes

`GET /api/orders/[orderRef]/notes` requires `orders.view`.

`POST /api/orders/[orderRef]/notes` requires admin mutation permission. Body: `{ "noteBody": "...", "noteType": "internal" }`.

The server validates order existence, note type, non-empty body, max length, and derives actor identity from the admin session.

## Events

`GET /api/orders/[orderRef]/events` requires `orders.view`.

Events are created by real workflows only: checkout creation, status updates, note creation, and invoice issuance.

## Invoices

`GET /api/orders/[orderRef]/invoices` requires `orders.view`.

`POST /api/orders/[orderRef]/invoices` issues or returns the existing issued invoice for the order. Invoice numbers are deterministic server-side values and protected by unique database indexes.
