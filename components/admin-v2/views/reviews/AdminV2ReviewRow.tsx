"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Box, Chip, Collapse, MenuItem, Rating, Select, Stack, TextField, Typography } from "@mui/material";
import type { ProductReview, ReviewStatus } from "@/app/lib/review-types";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { formatReviewDate, reviewSourceLabels, reviewStatusLabels } from "@/lib/admin-v2/reviews/review-format";

type Props = {
  review: ProductReview;
  canModerate: boolean;
  canFeature: boolean;
  canManage: boolean;
  onChanged: () => void;
};

const statusColors: Record<ReviewStatus, "default" | "warning" | "success" | "error"> = {
  pending: "warning",
  approved: "success",
  rejected: "error",
  hidden: "default",
};

async function mutateReview(method: "PATCH" | "DELETE", payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/reviews", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => null) as { errors?: string[] } | null;
  if (!response.ok) throw new Error(result?.errors?.[0] || "Review update failed.");
}

export function AdminV2ReviewRow({ review, canModerate, canFeature, canManage, onChanged }: Props) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [adminNote, setAdminNote] = useState(review.adminNote ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function patch(payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      await mutateReview("PATCH", { id: review.id, ...payload });
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Review update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete the review from ${review.customerName}? This cannot be undone.`)) return;
    setBusy(true);
    setError("");
    try {
      await mutateReview("DELETE", { id: review.id });
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Review deletion failed.");
      setBusy(false);
    }
  }

  return (
    <Box component="article" sx={{ py: 2.5, position: "relative", "& + &": { borderTop: 1, borderColor: "divider" } }}>
      <Stack direction="row" sx={{ gap: 2.5, justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{review.customerName}</Typography>
            <Rating value={review.rating} readOnly size="small" aria-label={`${review.rating} out of 5 stars`} />
            <Chip size="small" label={reviewStatusLabels[review.status]} color={statusColors[review.status]} />
            {review.isFeatured ? <Chip size="small" label="Featured" color="secondary" /> : null}
            {review.sourceType === "order-linked" && review.verifiedPurchase ? <Chip size="small" label="Verified purchase" color="info" /> : null}
          </Stack>
          <Typography variant="h6" sx={{ mt: 1 }}>{review.title || "Untitled review"}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>{review.body}</Typography>
          <Stack direction="row" sx={{ mt: 1.5, gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary">Product: {review.productId ? <Link href={`/admin-v2/products/${encodeURIComponent(review.productId)}`}>{review.productSlug || review.productId}</Link> : (review.productSlug || "—")}</Typography>
            {review.orderReference ? <Typography variant="caption" color="text.secondary">Order: <Link href={`/admin-v2/orders/${encodeURIComponent(review.orderReference)}`}>{review.orderReference}</Link></Typography> : null}
            <Typography variant="caption" color="text.secondary">{reviewSourceLabels[review.sourceType]}</Typography>
            <Typography variant="caption" color="text.secondary">{formatReviewDate(review.createdAt)}</Typography>
            <Typography variant="caption" color="text.secondary">{review.mediaUrls.length} media</Typography>
          </Stack>
          {review.adminNote ? <Typography variant="body2" sx={{ mt: 1.5, color: "warning.main" }}>Internal note: {review.adminNote}</Typography> : null}
        </Box>
        {(canModerate || canFeature || canManage) ? (
          <Stack sx={{ gap: 1, alignItems: "stretch", minWidth: 170 }}>
            {canModerate ? <Select size="small" value={review.status} disabled={busy} aria-label={`Moderation status for ${review.customerName}`} onChange={(event) => patch({ status: event.target.value })}>{(["pending", "approved", "rejected", "hidden"] as ReviewStatus[]).map((status) => <MenuItem key={status} value={status}>{reviewStatusLabels[status]}</MenuItem>)}</Select> : null}
            {canFeature && review.status === "approved" ? <V2Button size="small" variant="outlined" disabled={busy} onClick={() => patch({ isFeatured: !review.isFeatured })}>{review.isFeatured ? "Unfeature" : "Feature"}</V2Button> : null}
            {canModerate ? <V2Button size="small" variant="text" disabled={busy} onClick={() => setNoteOpen((open) => !open)}>{noteOpen ? "Close note" : "Admin note"}</V2Button> : null}
            {canModerate ? <V2Button size="small" color="error" variant="text" disabled={busy} onClick={remove}>Delete</V2Button> : null}
          </Stack>
        ) : null}
      </Stack>
      <Collapse in={noteOpen} unmountOnExit>
        <Stack direction="row" sx={{ mt: 2, gap: 1.5, alignItems: "flex-start" }}>
          <TextField multiline minRows={2} fullWidth label="Internal admin note" value={adminNote} slotProps={{ htmlInput: { maxLength: 500 } }} onChange={(event) => setAdminNote(event.target.value)} />
          <V2Button variant="contained" disabled={busy} onClick={() => patch({ adminNote })}>Save note</V2Button>
        </Stack>
      </Collapse>
      {error ? <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert> : null}
    </Box>
  );
}
