import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isLibraryMediaPath, libraryMediaPathFromFilename, renameLibraryMediaPath } from "../lib/admin-v2/media-library.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const uuid = "f014db35-cf90-4ee0-8be9-8b91f93a6812";

test("media library uses a dedicated safe unassociated prefix and preserves image extension", () => {
  const path = libraryMediaPathFromFilename("Summer hero.PNG", uuid);
  assert.equal(path, `media-library/summer-hero-${uuid}.png`);
  assert.equal(isLibraryMediaPath(path), true);
  assert.equal(isLibraryMediaPath("products/draft/images/anything.png"), false);
  assert.equal(isLibraryMediaPath("media-library/../orders.csv"), false);
  assert.equal(libraryMediaPathFromFilename("unsafe.gif", uuid), null);
});

test("renaming cannot change extension or escape the library prefix", () => {
  const original = `media-library/summer-hero-${uuid}.webp`;
  assert.equal(renameLibraryMediaPath(original, "Soft floral.webp"), `media-library/soft-floral-${uuid}.webp`);
  assert.equal(renameLibraryMediaPath(original, "Soft floral.png"), null);
  assert.equal(renameLibraryMediaPath("products/x/images/a.webp", "x.webp"), null);
});

test("native Media Library is guarded, validates content and never manages Classic paths", () => {
  const page = read("app/admin-v2/media/page.tsx");
  const store = read("lib/admin-v2/product-media-store.ts");
  const upload = read("app/api/admin-v2/media/upload/route.ts");
  const rename = read("app/api/admin-v2/media/rename/route.ts");
  const deletion = read("app/api/admin-v2/media/delete/route.ts");
  const association = read("app/api/admin-v2/media/associate/route.ts");
  const view = read("components/admin-v2/views/media/AdminV2MediaLibraryClient.tsx");
  assert.match(page, /requireAdminV2RouteAccess\(session, "media"\)/);
  assert.match(upload, /verifyFreshAdminRequestPermission\(request, "products\.media"\)/);
  assert.match(upload, /hasValidAdminV2ImageSignature/);
  assert.match(rename, /isLibraryMediaPath/);
  assert.match(deletion, /Only unassociated library images can be deleted here/);
  assert.match(store, /prefix: "media-library"/);
  assert.match(store, /isLibraryMediaPath\(sourcePath\)/);
  assert.match(association, /moveProductMediaObject\(input\.path, destination\)/);
  assert.match(association, /moveProductMediaObject\(destination, input\.path\)/);
  assert.match(association, /appendDraftProductImage/);
  assert.match(association, /logStaffActivity/);
  assert.match(view, /Search media/);
  assert.match(view, /Attach image to product/);
  assert.doesNotMatch(deletion, /products\//);
});

test("Classic Media remains a separate upload workflow", () => {
  const classic = read("app/api/product-media/upload/route.ts");
  assert.match(classic, /productSlug/);
  assert.match(classic, /products\/\$\{productSlug\}/);
  assert.match(classic, /verifyFreshAdminRequestPermission\(request, "products\.media"\)/);
});
