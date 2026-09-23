"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Stack, Typography } from "@mui/material";
import type { ProductReview } from "@/app/lib/review-types";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2SearchField } from "@/components/admin-v2/shared/V2SearchField";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { reviewStatusLabels } from "@/lib/admin-v2/reviews/review-format";
import { reviewListHref, type ReviewFilter } from "@/lib/admin-v2/reviews/review-query";
import { reviewMetrics } from "@/lib/admin-v2/reviews/review-metrics";
import { AdminV2ReviewCreateDialog } from "./AdminV2ReviewCreateDialog";
import { AdminV2ReviewRow } from "./AdminV2ReviewRow";
import type { ReviewProductOption } from "@/lib/admin-v2/reviews/review-product";

type Props = {
  allReviews: ProductReview[];
  products: ReviewProductOption[];
  productsAvailable: boolean;
  reviews: ProductReview[];
  query: string;
  status: ReviewFilter;
  page: number;
  totalPages: number;
  totalCount: number;
  permissions: { canModerate: boolean; canFeature: boolean; canManage: boolean };
};

const filters: Array<[ReviewFilter, string]> = [
  ["all", "All"], ["pending", reviewStatusLabels.pending], ["approved", reviewStatusLabels.approved],
  ["rejected", reviewStatusLabels.rejected], ["hidden", reviewStatusLabels.hidden],
];

export function AdminV2ReviewsView(props: Props) {
  const { allReviews, reviews, query, status, page, totalPages, totalCount, permissions } = props;
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();
  const metrics = reviewMetrics(allReviews);
  const refresh = () => router.refresh();

  return <>
    <V2PageHeader
      title="Reviews"
      description="Customer feedback moderation and product reviews."
      actions={permissions.canManage ? <V2Button variant="contained" onClick={() => setCreateOpen(true)}>Add review</V2Button> : undefined}
    />
    <V2Card sx={{ mb: 2.5 }}>
      <Stack direction="row" sx={{ gap: 0, flexWrap: "nowrap" }}>
        {([['Total reviews', metrics.total], ['Pending', metrics.pending], ['Approved', metrics.approved], ['Featured', metrics.featured]] as Array<[string, number]>).map(([label, value], index) => (
          <Box key={label} sx={{ flex: 1, minWidth: 0, px: index ? 3 : 0, borderLeft: index ? 1 : 0, borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="h5">{value}</Typography>
          </Box>
        ))}
      </Stack>
    </V2Card>
    <V2Card>
      <Stack direction="row" sx={{ gap: 2, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Box component="form" action="/admin-v2/reviews" method="get" sx={{ display: "flex", gap: 1 }}>
          {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
          <V2SearchField name="q" defaultValue={query} placeholder="Search customer, product, order, or review" slotProps={{ htmlInput: { "aria-label": "Search reviews" } }} sx={{ minWidth: 360 }} />
          <Button type="submit" variant="contained">Search</Button>
        </Box>
        <Typography variant="body2" color="text.secondary">{totalCount} matching reviews</Typography>
      </Stack>
      <Stack direction="row" sx={{ mt: 2, gap: 1, flexWrap: "wrap" }}>
        {filters.map(([value, label]) => <V2Button key={value} href={reviewListHref(query, value)} size="small" variant={status === value ? "contained" : "outlined"}>{label}</V2Button>)}
      </Stack>
      <Box sx={{ mt: 1.5 }}>
        {reviews.map((review) => <AdminV2ReviewRow key={review.id} review={review} {...permissions} onChanged={refresh} />)}
        {!reviews.length ? <Box sx={{ py: 7, textAlign: "center" }}><Typography variant="h6">No reviews found</Typography><Typography color="text.secondary" sx={{ mt: 0.75 }}>Try another search or moderation status.</Typography></Box> : null}
      </Box>
      <Stack direction="row" sx={{ pt: 2, borderTop: 1, borderColor: "divider", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" color="text.secondary">Page {page} of {totalPages}</Typography>
        <Stack direction="row" sx={{ gap: 1 }}>
          <V2Button href={reviewListHref(query, status, page - 1)} disabled={page <= 1}>Previous</V2Button>
          <V2Button href={reviewListHref(query, status, page + 1)} disabled={page >= totalPages}>Next</V2Button>
        </Stack>
      </Stack>
    </V2Card>
    {permissions.canManage ? <AdminV2ReviewCreateDialog products={props.products} productsAvailable={props.productsAvailable} open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refresh} /> : null}
  </>;
}
