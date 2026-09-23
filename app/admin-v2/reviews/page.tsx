import { Alert } from "@mui/material";
import { hasPermission } from "@/app/lib/admin-permissions";
import { listAllReviews } from "@/app/lib/review-store";
import { AdminV2ReviewsView } from "@/components/admin-v2/views/reviews/AdminV2ReviewsView";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { parseReviewFilter, queryReviews } from "@/lib/admin-v2/reviews/review-query";

export default async function AdminV2ReviewsPage(props: PageProps<"/admin-v2/reviews">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "reviews");
  const search = await props.searchParams;
  const query = typeof search.q === "string" ? search.q.slice(0, 160) : "";
  const status = parseReviewFilter(typeof search.status === "string" ? search.status : undefined);
  const requestedPage = typeof search.page === "string" ? Number(search.page) : 1;
  try {
    const allReviews = await listAllReviews();
    const result = queryReviews(allReviews, query, status, requestedPage);
    return <AdminV2ReviewsView
      allReviews={allReviews}
      query={query}
      status={status}
      permissions={{
        canModerate: hasPermission(session, "reviews.moderate") || hasPermission(session, "reviews.manage"),
        canFeature: hasPermission(session, "reviews.feature") || hasPermission(session, "reviews.manage"),
        canManage: hasPermission(session, "reviews.manage"),
      }}
      {...result}
    />;
  } catch {
    return <><V2PageHeader title="Reviews" description="Customer feedback moderation and product reviews." /><Alert severity="error" action={<V2Button href="/admin-v2/reviews">Retry</V2Button>}>Review data is temporarily unavailable.</Alert></>;
  }
}
