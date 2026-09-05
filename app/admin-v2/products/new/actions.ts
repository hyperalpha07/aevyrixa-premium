"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";
import {
  createDraftProduct,
  productStoreErrorResponse,
} from "@/app/lib/product-store";
import {
  validateAdminV2DraftProduct,
  type AdminV2DraftProductField,
} from "@/lib/admin-v2/product-create";

export type AdminV2CreateProductActionState = {
  errors: string[];
  fields: Partial<Record<AdminV2DraftProductField, string>>;
};

export async function createAdminV2DraftProductAction(
  _previousState: AdminV2CreateProductActionState,
  formData: FormData
): Promise<AdminV2CreateProductActionState> {
  const session = await getAdminSession();
  if (!session || !hasPermission(session, "products.create")) {
    return {
      errors: ["You do not have permission to create products."],
      fields: {},
    };
  }

  const validation = validateAdminV2DraftProduct({
    name: formData.get("name"),
    slug: formData.get("slug"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice"),
    category: formData.get("category"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    sizes: formData.get("sizes"),
    colors: formData.get("colors"),
    absorbency: formData.get("absorbency"),
    benefits: formData.get("benefits"),
    care: formData.get("care"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
    stockStatus: formData.get("stockStatus"),
    stockQuantity: formData.get("stockQuantity"),
    lowStockThreshold: formData.get("lowStockThreshold"),
  });

  if (!validation.input) {
    return {
      errors: validation.errors,
      fields: validation.fields,
    };
  }

  let productId: string;
  try {
    const result = await createDraftProduct(validation.input);
    productId = result.product.id;
    await logStaffActivity({
      actor: session,
      action: "product.draft_created",
      targetType: "product",
      targetId: productId,
      metadata: { name: result.product.name, status: "draft" },
    });
  } catch (error) {
    console.error("Failed to create Admin V2 draft product:", error);
    const response = productStoreErrorResponse(error, "Draft product could not be created.");
    return {
      errors: Array.isArray(response.body.errors)
        ? response.body.errors.filter((item): item is string => typeof item === "string")
        : ["Draft product could not be created."],
      fields:
        typeof response.body.fields === "object" &&
        response.body.fields !== null &&
        !Array.isArray(response.body.fields)
          ? (response.body.fields as Record<string, string>)
          : {},
    };
  }

  revalidatePath("/admin-v2/products");
  redirect(`/admin-v2/products/${encodeURIComponent(productId)}`);
}
