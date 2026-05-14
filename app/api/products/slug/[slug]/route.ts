import { getProductBySlug } from "@/app/lib/product-store";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const url = new URL(request.url);

  try {
    const result = await getProductBySlug(slug, {
      includeDrafts: url.searchParams.get("admin") === "1",
    });

    if (!result.product) {
      return Response.json(
        { product: null, storageMode: result.storageMode },
        { status: 404 }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error("Failed to load product by slug:", error);
    return Response.json(
      { product: null, errors: ["Unable to load product."] },
      { status: 500 }
    );
  }
}

