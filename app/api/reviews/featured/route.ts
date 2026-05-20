import { listFeaturedTestimonials } from "@/app/lib/review-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const reviews = await listFeaturedTestimonials(6);
  return Response.json({ reviews });
}
