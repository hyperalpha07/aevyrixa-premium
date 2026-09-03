import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateAdminV2PayableTotal,
  hasAdminV2TotalMismatch,
} from "../lib/admin-v2/orders/order-financials.ts";
import { createOrderInvoiceSnapshot, createDeterministicInvoiceNumber } from "../lib/admin-v2/orders/order-invoices.ts";
import { parseAdminV2OrderQuery } from "../lib/admin-v2/orders/order-query.ts";
import { validateAdminV2OrderNote } from "../lib/admin-v2/orders/order-note-validation.ts";
import { eventTypeForStatusChange, sanitizeOrderEventMetadata } from "../lib/admin-v2/orders/order-events.ts";
import { normalizeAdminV2ItemVariant } from "../lib/admin-v2/orders/order-variant.ts";
import { getAdminV2DeliveryNote } from "../lib/admin-v2/orders/order-notes.ts";
import { getAdminV2PaymentLabels } from "../lib/admin-v2/orders/order-payment.ts";
import {
  isSensitiveAdminV2OrderTransition,
  validNextAdminV2OrderStatuses,
} from "../lib/admin-v2/orders/order-status-transitions.ts";
import { normalizePermissions } from "../app/lib/admin-permissions.ts";
import { findAdminV2Route } from "../configs/admin-v2/routes.ts";
import { isAdminV2NavigationItemActive } from "../lib/admin-v2/navigation.ts";

const baseOrder = {
  orderId: "AEV-1",
  orderReference: "AEV-1",
  customer: {
    fullName: "Test Customer",
    phone: "01700000000",
    cityArea: "Dhaka",
    address: "Dhaka",
  },
  paymentDetails: {
    paymentMethod: "Cash on Delivery",
  },
  items: [],
  totals: {
    totalItems: 1,
    subtotal: 12,
  },
  totalAmount: 92,
  status: "Pending",
  createdAt: "2026-06-14T00:00:00.000Z",
};

test("payable total follows subtotal minus discount plus delivery", () => {
  assert.equal(
    calculateAdminV2PayableTotal({ subtotal: 120, discount: 20, deliveryCharge: 80 }),
    180
  );
  assert.equal(calculateAdminV2PayableTotal({ subtotal: 12, deliveryCharge: 80 }), 92);
});

test("historical mismatch detection only flags real total differences", () => {
  assert.equal(hasAdminV2TotalMismatch(12, 92), true);
  assert.equal(hasAdminV2TotalMismatch(92, 92), false);
  assert.equal(hasAdminV2TotalMismatch(92, 92.5), false);
});

test("variant normalization removes selected size and color tokens", () => {
  assert.equal(normalizeAdminV2ItemVariant("S / Black / Moderate", "S", "Black"), "Moderate");
  assert.equal(normalizeAdminV2ItemVariant("Black / S / Moderate", "S", "Black"), "Moderate");
  assert.equal(normalizeAdminV2ItemVariant("Moderate", "S", "Black"), "Moderate");
  assert.equal(normalizeAdminV2ItemVariant(undefined, "S", "Black"), null);
  assert.equal(normalizeAdminV2ItemVariant("S / Black / Moderate", undefined, undefined), "S / Black / Moderate");
  assert.equal(normalizeAdminV2ItemVariant("Black Pearl", "S", "White"), "Black Pearl");
});

test("delivery zone is not displayed as a delivery note", () => {
  assert.equal(
    getAdminV2DeliveryNote({
      ...baseOrder,
      deliveryZone: "Inside Dhaka",
      deliveryNote: "Zone: Inside Dhaka",
    }),
    null
  );
  assert.equal(
    getAdminV2DeliveryNote({
      ...baseOrder,
      deliveryZone: "Inside Dhaka",
      deliveryNote: "Zone: Inside Dhaka | Leave at reception",
    }),
    "Leave at reception"
  );
});

test("COD payment labels do not infer completed payment", () => {
  assert.deepEqual(
    getAdminV2PaymentLabels({
      ...baseOrder,
      paymentDetails: { paymentMethod: "Cash on Delivery" },
    }),
    {
      method: "Cash on Delivery",
      status: "Pay on Delivery",
      verification: "Not provided",
      provider: "Not provided",
      transactionReference: "Not provided",
      paidAmount: null,
      dueAmount: null,
    }
  );
});

test("status transition helpers expose valid next states and sensitive transitions", () => {
  assert.deepEqual(validNextAdminV2OrderStatuses("Pending"), ["Confirmed", "Cancelled"]);
  assert.equal(validNextAdminV2OrderStatuses("Pending").includes("Delivered"), false);
  assert.equal(isSensitiveAdminV2OrderTransition("Pending", "Cancelled"), true);
  assert.equal(isSensitiveAdminV2OrderTransition("Pending", "Confirmed"), false);
});

test("note validation rejects empty notes and invalid types", () => {
  assert.deepEqual(validateAdminV2OrderNote({ noteBody: "   ", noteType: "internal" }).errors, [
    "Note body is required.",
  ]);
  assert.equal(validateAdminV2OrderNote({ noteBody: "Real note", noteType: "payment" }).noteType, "payment");
  assert.equal(validateAdminV2OrderNote({ noteBody: "Real note", noteType: "fake" }).errors[0], "Note type is invalid.");
});

test("event helpers map status transitions and strip sensitive metadata", () => {
  assert.equal(eventTypeForStatusChange("Confirmed"), "order_confirmed");
  assert.equal(eventTypeForStatusChange("Cancelled"), "order_cancelled");
  assert.deepEqual(sanitizeOrderEventMetadata({ token: "x", fields: ["status"] }), { fields: ["status"] });
});

test("server-side order query parser caps and sanitizes filters", () => {
  const query = parseAdminV2OrderQuery(
    new URLSearchParams("q=abc&status=Delivered&payment=Cash+on+Delivery&page=2&pageSize=500&sort=highest")
  );
  assert.equal(query.q, "abc");
  assert.equal(query.status, "Delivered");
  assert.equal(query.page, 2);
  assert.equal(query.pageSize, 50);
  assert.equal(query.sort, "highest");
});

test("invoice number is deterministic and snapshot uses normalized totals", () => {
  const invoiceNumber = createDeterministicInvoiceNumber("AEV-1", "2026-06-14T00:00:00.000Z");
  assert.equal(invoiceNumber, "AEV-INV-20260614-AEV-1");
  const snapshot = createOrderInvoiceSnapshot({ ...baseOrder, deliveryCharge: 80 } as never);
  assert.equal((snapshot.totals as { total: number }).total, 92);
});

test("financial audit detection flags stored total differences without mutation", () => {
  const calculated = calculateAdminV2PayableTotal({ subtotal: 100, deliveryCharge: 20 });
  assert.equal(calculated, 120);
  assert.equal(hasAdminV2TotalMismatch(100, calculated), true);
});

test("invoice and note capabilities use dedicated role permissions", () => {
  const orderStaff = normalizePermissions("order_staff", {});
  assert.equal(orderStaff["orders.viewInvoice"], true);
  assert.equal(orderStaff["orders.issueInvoice"], true);
  assert.equal(orderStaff["orders.addNote"], true);

  const viewer = normalizePermissions("viewer", {});
  assert.equal(viewer["orders.viewInvoice"], true);
  assert.equal(viewer["orders.issueInvoice"], false);
  assert.equal(viewer["orders.addNote"], false);

  const restrictedOrderStaff = normalizePermissions("order_staff", {
    "orders.issueInvoice": false,
  });
  assert.equal(restrictedOrderStaff["orders.issueInvoice"], false);
});

test("implemented Admin V2 route metadata includes contextual invoice", () => {
  assert.equal(findAdminV2Route("dashboard")?.implemented, true);
  assert.equal(findAdminV2Route("orders")?.implemented, true);
  assert.equal(findAdminV2Route("orderDetail")?.implemented, true);
  assert.equal(findAdminV2Route("orderInvoice")?.implemented, true);
  assert.equal(findAdminV2Route("products")?.implemented, true);
  assert.equal(findAdminV2Route("productDetail")?.implemented, true);
  assert.equal(findAdminV2Route("productNew")?.implemented, false);
  assert.equal(findAdminV2Route("categories")?.implemented, false);
  assert.equal(findAdminV2Route("inventory")?.implemented, false);
});

test("product navigation has only the correct active child", () => {
  const allProducts = { href: "/admin-v2/products", module: "products" };
  const newProduct = { href: "/admin-v2/products/new", module: "productNew" };

  assert.equal(isAdminV2NavigationItemActive("/admin-v2/products", allProducts), true);
  assert.equal(isAdminV2NavigationItemActive("/admin-v2/products", newProduct), false);
  assert.equal(isAdminV2NavigationItemActive("/admin-v2/products/new", allProducts), false);
  assert.equal(isAdminV2NavigationItemActive("/admin-v2/products/new", newProduct), true);
  assert.equal(isAdminV2NavigationItemActive("/admin-v2/products/product-1", allProducts), true);
});
