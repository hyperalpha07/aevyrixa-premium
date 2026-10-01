import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { listProducts } from "@/app/lib/product-store";
import { isPublicCatalogProduct } from "@/app/lib/product-types";
import {
  addMessage,
  addMessageProductShare,
  getConversationById,
} from "@/app/lib/support-store";

export const dynamic = "force-dynamic";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
}

function stringField(payload: unknown, key: string) {
  return typeof payload === "object" && payload !== null && !Array.isArray(payload) && typeof (payload as Record<string, unknown>)[key] === "string"
    ? String((payload as Record<string, unknown>)[key]).trim()
    : "";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyFreshAdminRequestPermission(request, "support.reply");
  if (!session) return forbiddenAdminResponse();

  const { id } = await params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid request body." }, { status: 400 });
  }

  const productId = stringField(payload, "productId");
  const productSlug = stringField(payload, "productSlug");
  if (!productId && !productSlug) {
    return json({ error: "Choose a product to share." }, { status: 400 });
  }

  try {
    const conversation = await getConversationById(id);
    if (!conversation) return json({ error: "Conversation not found." }, { status: 404 });
    if (conversation.status === "closed") return json({ error: "Conversation is closed." }, { status: 410 });

    const catalog = await listProducts({ scope: "admin" });
    const product = catalog.products.find((item) =>
      (productId && item.id === productId) || (productSlug && item.slug === productSlug)
    );

    if (!product || !isPublicCatalogProduct(product)) {
      return json({ error: "Only active storefront products can be shared." }, { status: 400 });
    }

    const message = await addMessage(id, `Shared product: ${product.name}`, "admin");
    const share = await addMessageProductShare(message.id, id, {
      product_id: product.id,
      product_slug: product.slug,
      title: product.name,
      image_url: product.primaryImageUrl || product.imageUrl || product.images?.[0] || null,
      price: typeof product.price === "number" ? product.price : null,
      currency: product.currency || "BDT",
      stock_status: product.stockStatus || null,
    });

    await logStaffActivity({
      actor: session,
      action: "support.product_shared",
      targetType: "conversation",
      targetId: id,
      metadata: { messageId: message.id, productId: product.id, productSlug: product.slug },
    });

    return json({
      message: {
        id: message.id,
        body: message.body,
        sender_type: message.sender_type,
        created_at: message.created_at,
        attachments: [],
        product_shares: [share],
        order_shares: [],
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to share support product:", error);
    return json({ error: "Could not share product." }, { status: 503 });
  }
}
