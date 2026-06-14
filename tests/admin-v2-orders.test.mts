import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateAdminV2PayableTotal,
  hasAdminV2TotalMismatch,
} from "../lib/admin-v2/orders/order-financials.ts";
import { normalizeAdminV2ItemVariant } from "../lib/admin-v2/orders/order-variant.ts";
import { getAdminV2DeliveryNote } from "../lib/admin-v2/orders/order-notes.ts";
import { getAdminV2PaymentLabels } from "../lib/admin-v2/orders/order-payment.ts";
import {
  isSensitiveAdminV2OrderTransition,
  validNextAdminV2OrderStatuses,
} from "../lib/admin-v2/orders/order-status-transitions.ts";

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
