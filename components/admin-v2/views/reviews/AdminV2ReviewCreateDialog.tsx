"use client";

import { useState } from "react";
import { Alert, Box, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Rating, Stack, TextField, Typography } from "@mui/material";
import type { ReviewSourceType, ReviewStatus } from "@/app/lib/review-types";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { selectedReviewProduct, type ReviewProductOption } from "@/lib/admin-v2/reviews/review-product";

export function AdminV2ReviewCreateDialog({ open, onClose, onCreated, products, productsAvailable }: { open: boolean; onClose: () => void; onCreated: () => void; products: ReviewProductOption[]; productsAvailable: boolean }) {
  const [productId, setProductId] = useState("");
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selectedProduct = productsAvailable ? selectedReviewProduct(products, productId) : null;
  const hasActiveProducts = products.some((product) => selectedReviewProduct(products, product.id));

  async function submit(formData: FormData) {
    if (!selectedProduct || busy) {
      setError("Select an active product before adding a review.");
      return;
    }
    setBusy(true);
    setError("");
    try {
    const response = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...selectedProduct,
        customerName: formData.get("customerName"), rating,
        title: formData.get("title"), body: formData.get("body"),
        sourceType: formData.get("sourceType") as ReviewSourceType,
        status: formData.get("status") as ReviewStatus,
        adminNote: formData.get("adminNote"),
      }),
    });
    const result = await response.json().catch(() => null) as { errors?: string[] } | null;
    if (!response.ok) { setError(result?.errors?.[0] || "Review creation failed."); return; }
    onCreated();
    onClose();
    } catch {
      setError("Review creation failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
    <DialogTitle>Add review</DialogTitle>
    <Stack component="form" action={submit}>
      <DialogContent><Stack sx={{ gap: 2 }}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {!productsAvailable ? <Alert severity="warning">Product catalog is temporarily unavailable. Refresh to try again.</Alert> : !hasActiveProducts ? <Alert severity="info">No active products are available. Publish a product before adding a storefront review.</Alert> : null}
        <TextField label="Product" select required value={productId} disabled={busy || !productsAvailable || !hasActiveProducts} onChange={(event) => setProductId(event.target.value)}>
          <MenuItem value="" disabled>Select a product</MenuItem>
          {products.map((product) => <MenuItem key={product.id} value={product.id} disabled={!selectedReviewProduct(products, product.id)} sx={{ whiteSpace: "normal" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2">{product.name}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{product.slug}{product.status === "draft" ? " — Draft — not visible on storefront" : ""}</Typography>
            </Box>
          </MenuItem>)}
        </TextField>
        <TextField name="customerName" label="Customer name" required slotProps={{ htmlInput: { maxLength: 120 } }} />
        <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>Rating <Rating value={rating} onChange={(_, value) => setRating(value || 1)} /></Stack>
        <TextField name="title" label="Title (optional)" slotProps={{ htmlInput: { maxLength: 120 } }} />
        <TextField name="body" label="Review" required multiline minRows={4} slotProps={{ htmlInput: { maxLength: 1200 } }} />
        <TextField name="sourceType" label="Source" select defaultValue="admin-added">{(["admin-added", "imported"] as ReviewSourceType[]).map((source) => <MenuItem key={source} value={source}>{source === "admin-added" ? "Admin-added" : "Imported"}</MenuItem>)}</TextField>
        <TextField name="status" label="Status" select defaultValue="pending">{(["pending", "approved", "rejected", "hidden"] as ReviewStatus[]).map((status) => <MenuItem key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</MenuItem>)}</TextField>
        <TextField name="adminNote" label="Internal admin note (optional)" multiline minRows={2} slotProps={{ htmlInput: { maxLength: 500 } }} />
      </Stack></DialogContent>
      <DialogActions><V2Button onClick={onClose} disabled={busy}>Cancel</V2Button><V2Button type="submit" variant="contained" loading={busy} disabled={!selectedProduct}>Add review</V2Button></DialogActions>
    </Stack>
  </Dialog>;
}
