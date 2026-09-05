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
import { hasPermission } from "../app/lib/admin-permissions.ts";
import { findAdminV2Route } from "../configs/admin-v2/routes.ts";
import { isAdminV2NavigationItemActive } from "../lib/admin-v2/navigation.ts";
import { readFileSync, existsSync } from "node:fs";
import { registerHooks } from "node:module";
import type { DraftEditRequest } from "../lib/admin-v2/product-edit.ts";
import {
  slugifyAdminV2ProductName,
  validateAdminV2DraftProduct,
} from "../lib/admin-v2/product-create.ts";
import {
  ADMIN_V2_MEDIA_MAX_BYTES,
  ADMIN_V2_MEDIA_MAX_MB,
  appendDraftProductImage,
  draftMediaUpdateQuery,
  draftProductMediaUrls,
  draftProductMediaPath,
  hasValidAdminV2ImageSignature,
  mediaStepFailure,
  moveDraftProductImage,
  removeDraftProductImage,
  safeDraftMediaStoragePath,
  setDraftPrimaryImage,
  validateAdminV2MediaFile,
} from "../lib/admin-v2/product-media.ts";
import {
  PUBLISH_CONFIRMATION,
  evaluatePublishReadiness,
  publishPayload,
  publishSlugQuery,
  publishUpdateQuery,
  validatePublishConfirmation,
} from "../lib/admin-v2/product-publish.ts";
import {
  UNPUBLISH_CONFIRMATION,
  isUnpublishableActive,
  unpublishPayload,
  unpublishUpdateQuery,
  validateUnpublishConfirmation,
} from "../lib/admin-v2/product-unpublish.ts";

// Resolve the one extensionless application import for Node's native TS test runner.
const editModuleHooks = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === "./product-create" && context.parentURL?.endsWith("/lib/admin-v2/product-edit.ts")) {
    return nextResolve("./product-create.ts", context);
  }
  return nextResolve(specifier, context);
} });
const { draftEditInitialValues, draftEditPayload, draftEditQuery, duplicateDraftSlugQuery,
  isEditableDraft, persistDraftEdit, validateDraftEdit } = await import("../lib/admin-v2/product-edit.ts");
editModuleHooks.deregister();

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
  assert.equal(findAdminV2Route("productNew")?.implemented, true);
  assert.equal(findAdminV2Route("categories")?.implemented, false);
  assert.equal(findAdminV2Route("inventory")?.implemented, false);
});

test("draft product creation uses a dedicated least-privilege permission", () => {
  const viewer = normalizePermissions("viewer", {});
  assert.equal(viewer["products.view"], true);
  assert.equal(viewer["products.create"], false);

  const editor = normalizePermissions("viewer", { "products.edit": true });
  assert.equal(editor["products.edit"], true);
  assert.equal(editor["products.create"], false);

  const owner = {
    userType: "owner" as const,
    username: "owner",
    displayName: "Owner",
    role: "owner" as const,
    permissions: normalizePermissions("owner", {}),
  };
  assert.equal(hasPermission(owner, "products.create"), true);

  const explicitlyAllowedViewer = {
    userType: "staff" as const,
    username: "catalog-assistant",
    displayName: "Catalog Assistant",
    role: "viewer" as const,
    permissions: normalizePermissions("viewer", { "products.create": true }),
  };
  assert.equal(hasPermission(explicitlyAllowedViewer, "products.create"), true);
});

test("draft product input is sanitized, deduplicated, and forced private", () => {
  const result = validateAdminV2DraftProduct({
    name: "  Noromi Test Product  ",
    slug: "noromi-test-product",
    price: "850",
    compareAtPrice: "950",
    category: " Reusable Period Panty ",
    sizes: "S, M, s, L",
    colors: "Black\nBlack\nNude",
    status: "active",
    featured: true,
    imageUrl: "https://example.com/not-accepted.jpg",
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.input?.status, "draft");
  assert.equal(result.input?.featured, false);
  assert.equal(result.input?.showOnHomepage, false);
  assert.deepEqual(result.input?.sizes, ["S", "M", "L"]);
  assert.deepEqual(result.input?.colors, ["Black", "Nude"]);
  assert.equal("imageUrl" in (result.input ?? {}), false);
});

test("draft product validation rejects unsafe slug and pricing", () => {
  const result = validateAdminV2DraftProduct({
    name: "Invalid Product",
    slug: "Invalid Product",
    price: "0",
    compareAtPrice: "0",
    category: "",
  });

  assert.equal(result.input, null);
  assert.match(result.fields.slug ?? "", /lowercase/);
  assert.match(result.fields.price ?? "", /greater than zero/);
  assert.match(result.fields.compareAtPrice ?? "", /greater than/);
  assert.match(result.fields.category ?? "", /required/);
  assert.equal(slugifyAdminV2ProductName(" Noromi Care — Black Comfort "), "noromi-care-black-comfort");
});

test("product navigation has only the correct active child", () => {
  const allProducts = { href: "/admin-v2/products", module: "products" };
  const newProduct = { href: "/admin-v2/products/new", module: "productNew" };

  assert.equal(isAdminV2NavigationItemActive("/admin-v2/products", allProducts), true);
  assert.equal(isAdminV2NavigationItemActive("/admin-v2/products", newProduct), false);
  assert.equal(isAdminV2NavigationItemActive("/admin-v2/products/new", allProducts), false);
  assert.equal(isAdminV2NavigationItemActive("/admin-v2/products/new", newProduct), true);
  assert.equal(isAdminV2NavigationItemActive("/admin-v2/products/product-1", allProducts), true);
  assert.equal(isAdminV2NavigationItemActive("/admin-v2/products/product-1/edit", allProducts), true);
  assert.equal(isAdminV2NavigationItemActive("/admin-v2/products/product-1/edit", newProduct), false);
});

const editId = "d8d79c19-1c3b-4905-92cf-b1809b6fa0f3";
const editRow = {
  id: editId, status: "draft", deleted_at: null, updated_at: "2026-09-01T00:00:00Z",
  name: "Stored draft", slug: "stored-draft", price: 850, category: "Reusable Period Panty",
  sizes: ["S", "M"], benefits: ["First benefit, with a comma"], care: ["Wash gently, air dry"],
  image_url: "original-image.jpg", images: ["original-gallery.jpg"], media: [{ type: "original" }],
  merchandising: { badgeStyle: "info", showOnHomepage: true, lowStockThreshold: 3 },
};
const editValues = draftEditInitialValues(editRow);

test("draft edit route exists and requires edit without granting create/view holders edit", () => {
  assert.equal(findAdminV2Route("productEdit")?.implemented, true);
  assert.ok(existsSync(new URL("../app/admin-v2/products/[productId]/edit/page.tsx", import.meta.url)));
  const rules = readFileSync(new URL("../configs/admin-v2/permissions.ts", import.meta.url), "utf8");
  assert.match(rules, /productEdit: \{ permission: "products.edit" \}/);
  for (const permissions of [{ "products.view": true }, { "products.create": true }]) {
    assert.equal(normalizePermissions("viewer", permissions)["products.edit"], false);
  }
  assert.equal(normalizePermissions("owner", {})["products.edit"], true);
});

test("draft edit rejects forbidden fields, invalid numbers and oversized existing copy", () => {
  for (const key of ["status", "publish", "featured", "showOnHomepage", "images", "media", "imageUrl", "deletedAt", "id"]) {
    assert.equal(validateDraftEdit({ ...editValues, [key]: "active" }).input, null, key);
  }
  assert.equal(validateDraftEdit({ ...editValues, stockStatus: "invented" }).input, null);
  assert.equal(validateDraftEdit({ ...editValues, price: "NaN" }).input, null);
  assert.equal(validateDraftEdit({ ...editValues, stockQuantity: "2.5" }).input, null);
  assert.equal(validateDraftEdit({ ...editValues, name: "x".repeat(181) }).input, null);
  assert.equal(validateDraftEdit({ ...editValues, benefits: "x".repeat(101) }).input, null);
});

test("draft edit preserves list punctuation, clears optional numbers, forces private flags and omits media", () => {
  const { payload } = draftEditPayload({ ...editValues, sizes: " S \nM\ns", compareAtPrice: "", lowStockThreshold: "" }, editRow.merchandising);
  assert.ok(payload);
  assert.equal(payload.status, "draft");
  assert.equal(payload.featured, false);
  assert.equal(payload.compare_at_price, null);
  assert.equal(payload.stock_quantity, null);
  assert.equal(payload.merchandising.lowStockThreshold, null);
  assert.equal(payload.merchandising.showOnHomepage, false);
  assert.equal(payload.merchandising.isTrending, false);
  assert.equal(payload.merchandising.isBestSeller, false);
  assert.equal(payload.merchandising.isNewArrival, false);
  assert.equal(payload.merchandising.showInFeaturedCollection, false);
  assert.equal((payload.merchandising as Record<string, unknown>).badgeStyle, "info");
  assert.deepEqual(payload.sizes, ["S", "M"]);
  assert.deepEqual(payload.benefits, editRow.benefits);
  assert.deepEqual(payload.care, editRow.care);
  for (const field of ["image_url", "primary_image_url", "images", "media", "currency", "deleted_at", "id"]) assert.equal(field in payload, false);
});

test("draft edit queries exclude other statuses/deleted rows and current slug owner", () => {
  const query = draftEditQuery(editId);
  assert.equal(query.get("id"), `eq.${editId}`);
  assert.equal(query.get("status"), "eq.draft");
  assert.equal(query.get("deleted_at"), "is.null");
  const duplicate = duplicateDraftSlugQuery(editId, "stored-draft");
  assert.equal(duplicate.get("id"), `neq.${editId}`);
  assert.equal(duplicate.get("deleted_at"), "is.null");
  assert.equal(isEditableDraft({ status: "active", deleted_at: null }), false);
  assert.equal(isEditableDraft({ status: "draft", deleted_at: "yesterday" }), false);
  assert.equal(isEditableDraft({ status: "unknown", deleted_at: null }), false);
});

test("draft update does not write for invalid, missing, active or deleted products", async () => {
  for (const row of [null, { ...editRow, status: "active" }, { ...editRow, deleted_at: "yesterday" }]) {
    const request: DraftEditRequest = async (_query, init) => {
      assert.equal(init?.method, undefined);
      return Response.json(row ? [row] : []);
    };
    assert.notEqual((await persistDraftEdit(editId, editValues, request)).saved, true);
  }
  await persistDraftEdit(editId, { ...editValues, name: "" }, async () => { throw new Error("Invalid data must not request the database"); });
});

test("draft update writes exactly once, preserving media and checking concurrent state", async () => {
  const calls: Array<{ query: URLSearchParams; init?: RequestInit }> = [];
  const request: DraftEditRequest = async (query, init) => {
    calls.push({ query, init });
    if (calls.length === 1) return Response.json([editRow]);
    if (calls.length === 2) return Response.json([]);
    assert.equal(init?.method, "PATCH");
    assert.equal(query.get("status"), "eq.draft");
    assert.equal(query.get("updated_at"), `eq.${editRow.updated_at}`);
    const body = JSON.parse(String(init?.body));
    assert.equal(body.status, "draft");
    assert.equal("images" in body, false);
    assert.equal("media" in body, false);
    return Response.json([{ id: editId }]);
  };
  assert.equal((await persistDraftEdit(editId, editValues, request)).saved, true);
  assert.equal(calls.length, 3);
});

test("draft update handles duplicate slugs and a concurrent publish without success", async () => {
  for (const scenario of ["duplicate", "race", "unique-constraint"] as const) {
    let count = 0;
    const request: DraftEditRequest = async (_query, init) => {
      count++;
      if (count === 1) return Response.json([editRow]);
      if (count === 2) return Response.json(scenario === "duplicate" ? [{ id: "other" }] : []);
      assert.equal(init?.method, "PATCH");
      return scenario === "unique-constraint" ? Response.json({ code: "23505" }, { status: 409 }) : Response.json([]);
    };
    const result = await persistDraftEdit(editId, editValues, request);
    assert.notEqual(result.saved, true);
    if (scenario !== "race") assert.ok(result.fields.slug);
    assert.equal(count, scenario === "duplicate" ? 2 : 3);
  }
});

test("draft edit supports legacy schema without silently discarding a threshold", async () => {
  const legacy: Record<string, unknown> = { ...editRow };
  delete legacy.merchandising;
  let writes = 0;
  const request: DraftEditRequest = async (query, init) => {
    if (!init?.method) return Response.json(query.get("slug") ? [] : [legacy]);
    writes++;
    const body = JSON.parse(String(init.body));
    assert.equal("merchandising" in body, false);
    assert.equal(body.status, "draft");
    assert.equal(body.featured, false);
    return Response.json([{ id: editId }]);
  };
  assert.ok((await persistDraftEdit(editId, editValues, request)).fields.lowStockThreshold);
  assert.equal(writes, 0);
  assert.equal((await persistDraftEdit(editId, { ...editValues, lowStockThreshold: "" }, request)).saved, true);
  assert.equal(writes, 1);
});

test("draft product media route uses a separate least-privilege permission", () => {
  assert.equal(findAdminV2Route("productMedia")?.implemented, true);
  assert.ok(existsSync(new URL("../app/admin-v2/products/[productId]/media/page.tsx", import.meta.url)));
  const rules = readFileSync(new URL("../configs/admin-v2/permissions.ts", import.meta.url), "utf8");
  assert.match(rules, /productMedia: \{ permission: "products.media" \}/);
  const action = readFileSync(new URL("../app/admin-v2/products/[productId]/media/actions.ts", import.meta.url), "utf8");
  assert.match(action, /hasPermission\(session, "products\.media"\)/);
  for (const permissions of [{ "products.view": true }, { "products.create": true }, { "products.edit": true }]) {
    assert.equal(normalizePermissions("viewer", permissions)["products.media"], false);
  }
  assert.equal(normalizePermissions("owner", {})["products.media"], true);
});

test("draft media validation accepts only matching JPG, PNG and WebP up to 20 MB", () => {
  const file = (name: string, type: string, size = 100) => ({ name, type, size }) as File;
  assert.equal(validateAdminV2MediaFile(file("photo.jpg", "image/jpeg")).valid, true);
  assert.equal(validateAdminV2MediaFile(file("photo.png", "image/png")).valid, true);
  assert.equal(validateAdminV2MediaFile(file("photo.webp", "image/webp")).valid, true);
  assert.equal(validateAdminV2MediaFile(file("photo.svg", "image/svg+xml")).valid, false);
  assert.equal(validateAdminV2MediaFile(file("photo.exe", "application/octet-stream")).valid, false);
  assert.equal(validateAdminV2MediaFile(file("photo.png", "image/jpeg")).valid, false);
  assert.equal(validateAdminV2MediaFile(file("large.jpg", "image/jpeg", ADMIN_V2_MEDIA_MAX_BYTES + 1)).valid, false);
  assert.equal(ADMIN_V2_MEDIA_MAX_MB, 20);
  assert.equal(ADMIN_V2_MEDIA_MAX_BYTES, 20 * 1024 * 1024);
  assert.equal(hasValidAdminV2ImageSignature("image/jpeg", new Uint8Array([0xff, 0xd8, 0xff, 0x00])), true);
  assert.equal(hasValidAdminV2ImageSignature("image/png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), true);
  assert.equal(hasValidAdminV2ImageSignature("image/webp", new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])), true);
  assert.equal(hasValidAdminV2ImageSignature("image/jpeg", new Uint8Array([0x4d, 0x5a, 0x90])), false);
});

test("draft media paths ignore client filenames and gallery append preserves order", () => {
  const path = draftProductMediaPath(editId, "SAFE-ID_../evil", "webp");
  assert.equal(path, `products/${editId}/images/safe-idevil.webp`);
  assert.equal(path.includes("photo"), false);
  const existing = { images: ["first.jpg", "second.jpg"], primary_image_url: "primary.jpg" };
  assert.deepEqual(appendDraftProductImage(existing, "new.jpg", path), { images: ["first.jpg", "second.jpg", "new.jpg"] });
  assert.deepEqual(appendDraftProductImage({ images: [], primary_image_url: null, primary_image_path: null, image_url: null }, "first.jpg", path), {
    images: ["first.jpg"], primary_image_url: "first.jpg", primary_image_path: path, image_url: "first.jpg",
  });
  assert.deepEqual(appendDraftProductImage({ images: [] }, "first.jpg", path), { images: ["first.jpg"] });
  assert.deepEqual(Object.keys(appendDraftProductImage({ images: [], primary_image_url: null }, "first.jpg", path)).sort(), ["images", "primary_image_url"]);
});

test("draft media failures identify storage and database steps without secrets", () => {
  assert.equal(mediaStepFailure("storage", 403), "Storage upload failed (403). The image was not attached.");
  assert.equal(mediaStepFailure("database", 409), "Database attachment failed (409). Cleanup of the new storage object was attempted.");
  assert.equal(mediaStepFailure("storage").includes("service"), false);
});

test("draft media update query rejects active, deleted and concurrently changed rows", () => {
  const query = draftMediaUpdateQuery(editId, editRow.updated_at);
  assert.equal(query.get("id"), `eq.${editId}`);
  assert.equal(query.get("status"), "eq.draft");
  assert.equal(query.get("deleted_at"), "is.null");
  assert.equal(query.get("updated_at"), `eq.${editRow.updated_at}`);
  const allProducts = { href: "/admin-v2/products", module: "products" };
  const newProduct = { href: "/admin-v2/products/new", module: "productNew" };
  assert.equal(isAdminV2NavigationItemActive(`/admin-v2/products/${editId}/media`, allProducts), true);
  assert.equal(isAdminV2NavigationItemActive(`/admin-v2/products/${editId}/media`, newProduct), false);
});

test("draft media removal preserves order and safely replaces or clears primary fields", () => {
  const row = { images: ["one.jpg", "two.jpg", "three.jpg"], primary_image_url: "two.jpg", image_url: "two.jpg", primary_image_path: "old" };
  assert.deepEqual(removeDraftProductImage(row, editId, "two.jpg"), {
    images: ["one.jpg", "three.jpg"], primary_image_url: "one.jpg", image_url: "one.jpg", primary_image_path: null,
  });
  assert.deepEqual(removeDraftProductImage({ ...row, images: ["two.jpg"] }, editId, "two.jpg"), {
    images: [], primary_image_url: null, image_url: null, primary_image_path: null,
  });
  assert.equal(removeDraftProductImage(row, editId, "unknown.jpg"), null);
});

test("draft media primary selection and movement accept current gallery images only", () => {
  const row = { images: ["one.jpg", "two.jpg", "three.jpg"], primary_image_url: "one.jpg", image_url: "one.jpg" };
  assert.deepEqual(setDraftPrimaryImage(row, editId, "two.jpg"), { primary_image_url: "two.jpg", image_url: "two.jpg" });
  assert.equal(setDraftPrimaryImage(row, editId, "unknown.jpg"), null);
  assert.deepEqual(moveDraftProductImage(row, editId, "two.jpg", "up")?.images, ["two.jpg", "one.jpg", "three.jpg"]);
  assert.deepEqual(moveDraftProductImage(row, editId, "two.jpg", "down")?.images, ["one.jpg", "three.jpg", "two.jpg"]);
  assert.equal(moveDraftProductImage(row, editId, "unknown.jpg", "up"), null);
  assert.equal(moveDraftProductImage(row, editId, "one.jpg", "up"), null);
  assert.deepEqual(new Set(moveDraftProductImage(row, editId, "two.jpg", "down")?.images), new Set(draftProductMediaUrls(row)));
});

test("draft storage cleanup path is limited to generated images for the same product", () => {
  const path = `products/${editId}/images/abc-123.webp`;
  const publicUrl = `https://example.supabase.co/storage/v1/object/public/product-media/${path}`;
  assert.equal(safeDraftMediaStoragePath(publicUrl, editId), path);
  assert.equal(safeDraftMediaStoragePath(path, editId), path);
  assert.equal(safeDraftMediaStoragePath(`products/00000000-0000-0000-0000-000000000000/images/abc.webp`, editId), null);
  assert.equal(safeDraftMediaStoragePath("https://cdn.example.com/legacy.jpg", editId), null);
  assert.equal(safeDraftMediaStoragePath("/brand/noromi/logo.png", editId), null);
  assert.equal(safeDraftMediaStoragePath(`${path}/../other.webp`, editId), null);
});

test("new product explains media management begins after draft creation", () => {
  const source = readFileSync(new URL("../components/admin-v2/views/products/AdminV2NewProductView.tsx", import.meta.url), "utf8");
  assert.match(source, /After draft creation/);
  assert.match(source, /upload, remove, reorder, and choose the primary product image/);
  assert.match(source, /Description images and rich product content will be added in a later phase/);
});

const publishReadyRow = {
  ...editRow,
  short_description: "A concise product summary.",
  description: "A complete product description.",
  seo_title: "Stored draft",
  seo_description: "Stored draft product description.",
  stock_status: "in_stock",
  stock_quantity: 3,
  compare_at_price: 950,
  colors: ["Black"],
};

test("draft publish route uses a dedicated least-privilege permission", () => {
  assert.equal(findAdminV2Route("productPublish")?.implemented, true);
  assert.ok(existsSync(new URL("../app/admin-v2/products/[productId]/publish/page.tsx", import.meta.url)));
  const rules = readFileSync(new URL("../configs/admin-v2/permissions.ts", import.meta.url), "utf8");
  const action = readFileSync(new URL("../app/admin-v2/products/[productId]/publish/actions.ts", import.meta.url), "utf8");
  assert.match(rules, /productPublish: \{ permission: "products.publish" \}/);
  assert.match(action, /hasPermission\(session, "products\.publish"\)/);
  for (const permissions of [{ "products.view": true }, { "products.create": true }, { "products.edit": true }, { "products.media": true }]) {
    assert.equal(normalizePermissions("viewer", permissions)["products.publish"], false);
  }
  assert.equal(normalizePermissions("product_staff", {})["products.publish"], false);
  assert.equal(normalizePermissions("owner", {})["products.publish"], true);
});

test("publish readiness blocks missing fields, images, duplicates and non-draft rows", () => {
  assert.equal(evaluatePublishReadiness(publishReadyRow, { reachableImageCount: 1, duplicateSlug: false }).ready, true);
  for (const changed of [
    { name: "" }, { slug: "Invalid Slug" }, { category: "" }, { price: 0 },
    { short_description: "" }, { description: "" }, { status: "active" }, { deleted_at: "today" },
  ]) {
    assert.equal(evaluatePublishReadiness({ ...publishReadyRow, ...changed }, { reachableImageCount: 1, duplicateSlug: false }).ready, false);
  }
  assert.equal(evaluatePublishReadiness(publishReadyRow, { reachableImageCount: 0, duplicateSlug: false }).ready, false);
  assert.equal(evaluatePublishReadiness(publishReadyRow, { reachableImageCount: 1, duplicateSlug: true }).ready, false);
  assert.equal(evaluatePublishReadiness(publishReadyRow, { reachableImageCount: 1, duplicateSlug: false, unsafeMediaWarning: true }).ready, false);
});

test("publish requires exact typed confirmation", () => {
  assert.equal(validatePublishConfirmation(PUBLISH_CONFIRMATION), null);
  for (const value of ["", "publish", " PUBLISH ", null, undefined]) assert.ok(validatePublishConfirmation(value));
});

test("publish query is optimistic and payload changes status and timestamp only", () => {
  const query = publishUpdateQuery(editId, editRow.updated_at);
  assert.equal(query.get("id"), `eq.${editId}`);
  assert.equal(query.get("status"), "eq.draft");
  assert.equal(query.get("deleted_at"), "is.null");
  assert.equal(query.get("updated_at"), `eq.${editRow.updated_at}`);
  const payload = publishPayload("2026-09-05T00:00:00.000Z");
  assert.deepEqual(payload, { status: "active", updated_at: "2026-09-05T00:00:00.000Z" });
  assert.deepEqual(Object.keys(payload).sort(), ["status", "updated_at"]);
});

test("publish duplicate query excludes current non-deleted product and navigation stays under Products", () => {
  const query = publishSlugQuery(editId, "stored-draft");
  assert.equal(query.get("id"), `neq.${editId}`);
  assert.equal(query.get("slug"), "eq.stored-draft");
  assert.equal(query.get("deleted_at"), "is.null");
  const allProducts = { href: "/admin-v2/products", module: "products" };
  const newProduct = { href: "/admin-v2/products/new", module: "productNew" };
  assert.equal(isAdminV2NavigationItemActive(`/admin-v2/products/${editId}/publish`, allProducts), true);
  assert.equal(isAdminV2NavigationItemActive(`/admin-v2/products/${editId}/publish`, newProduct), false);
});

test("active unpublish route uses a separate least-privilege permission", () => {
  assert.equal(findAdminV2Route("productUnpublish")?.implemented, true);
  assert.ok(existsSync(new URL("../app/admin-v2/products/[productId]/unpublish/page.tsx", import.meta.url)));
  const rules = readFileSync(new URL("../configs/admin-v2/permissions.ts", import.meta.url), "utf8");
  const action = readFileSync(new URL("../app/admin-v2/products/[productId]/unpublish/actions.ts", import.meta.url), "utf8");
  assert.match(rules, /productUnpublish: \{ permission: "products.unpublish" \}/);
  assert.match(action, /hasPermission\(session, "products\.unpublish"\)/);
  for (const permissions of [{ "products.view": true }, { "products.edit": true }, { "products.media": true }, { "products.publish": true }]) {
    assert.equal(normalizePermissions("viewer", permissions)["products.unpublish"], false);
  }
  assert.equal(normalizePermissions("product_staff", {})["products.unpublish"], false);
  assert.equal(normalizePermissions("owner", {})["products.unpublish"], true);
});

test("unpublish requires exact typed confirmation and an active non-deleted row", () => {
  assert.equal(validateUnpublishConfirmation(UNPUBLISH_CONFIRMATION), null);
  for (const value of ["", "unpublish", " UNPUBLISH ", null, undefined]) assert.ok(validateUnpublishConfirmation(value));
  assert.equal(isUnpublishableActive({ status: "active", deleted_at: null }), true);
  assert.equal(isUnpublishableActive({ status: "draft", deleted_at: null }), false);
  assert.equal(isUnpublishableActive({ status: "active", deleted_at: "today" }), false);
  assert.equal(isUnpublishableActive(null), false);
});

test("unpublish query is active-only and optimistic, with a minimal payload", () => {
  const query = unpublishUpdateQuery(editId, editRow.updated_at);
  assert.equal(query.get("id"), `eq.${editId}`);
  assert.equal(query.get("status"), "eq.active");
  assert.equal(query.get("deleted_at"), "is.null");
  assert.equal(query.get("updated_at"), `eq.${editRow.updated_at}`);
  const payload = unpublishPayload("2026-09-05T00:00:00.000Z");
  assert.deepEqual(payload, { status: "draft", updated_at: "2026-09-05T00:00:00.000Z" });
  assert.deepEqual(Object.keys(payload).sort(), ["status", "updated_at"]);
});

test("unpublish product route stays under Products, not New Product", () => {
  const allProducts = { href: "/admin-v2/products", module: "products" };
  const newProduct = { href: "/admin-v2/products/new", module: "productNew" };
  assert.equal(isAdminV2NavigationItemActive(`/admin-v2/products/${editId}/unpublish`, allProducts), true);
  assert.equal(isAdminV2NavigationItemActive(`/admin-v2/products/${editId}/unpublish`, newProduct), false);
});
