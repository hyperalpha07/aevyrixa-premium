import { listApprovedReviewsForProduct } from "@/app/lib/review-store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const reviews = await listApprovedReviewsForProduct(slug);
  return Response.json({ reviews });
}
