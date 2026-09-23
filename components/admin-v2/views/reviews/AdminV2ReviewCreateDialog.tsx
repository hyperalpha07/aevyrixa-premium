"use client";

import { useState } from "react";
import { Alert, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Rating, Stack, TextField } from "@mui/material";
import type { ReviewSourceType, ReviewStatus } from "@/app/lib/review-types";
import { V2Button } from "@/components/admin-v2/shared/V2Button";

export function AdminV2ReviewCreateDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId: formData.get("productId"), productSlug: formData.get("productSlug"),
        customerName: formData.get("customerName"), rating,
        title: formData.get("title"), body: formData.get("body"),
        sourceType: formData.get("sourceType") as ReviewSourceType,
        status: formData.get("status") as ReviewStatus,
        adminNote: formData.get("adminNote"),
      }),
    });
    const result = await response.json().catch(() => null) as { errors?: string[] } | null;
    setBusy(false);
    if (!response.ok) { setError(result?.errors?.[0] || "Review creation failed."); return; }
    onCreated();
    onClose();
  }

  return <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
    <DialogTitle>Add review</DialogTitle>
    <Stack component="form" action={submit}>
      <DialogContent><Stack sx={{ gap: 2 }}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <TextField name="productSlug" label="Product slug" required slotProps={{ htmlInput: { maxLength: 160 } }} />
        <TextField name="productId" label="Product ID (optional)" slotProps={{ htmlInput: { maxLength: 120 } }} />
        <TextField name="customerName" label="Customer name" required slotProps={{ htmlInput: { maxLength: 120 } }} />
        <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>Rating <Rating value={rating} onChange={(_, value) => setRating(value || 1)} /></Stack>
        <TextField name="title" label="Title (optional)" slotProps={{ htmlInput: { maxLength: 120 } }} />
        <TextField name="body" label="Review" required multiline minRows={4} slotProps={{ htmlInput: { maxLength: 1200 } }} />
        <TextField name="sourceType" label="Source" select defaultValue="admin-added">{(["admin-added", "imported"] as ReviewSourceType[]).map((source) => <MenuItem key={source} value={source}>{source === "admin-added" ? "Admin-added" : "Imported"}</MenuItem>)}</TextField>
        <TextField name="status" label="Status" select defaultValue="pending">{(["pending", "approved", "rejected", "hidden"] as ReviewStatus[]).map((status) => <MenuItem key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</MenuItem>)}</TextField>
        <TextField name="adminNote" label="Internal admin note (optional)" multiline minRows={2} slotProps={{ htmlInput: { maxLength: 500 } }} />
      </Stack></DialogContent>
      <DialogActions><V2Button onClick={onClose} disabled={busy}>Cancel</V2Button><V2Button type="submit" variant="contained" loading={busy}>Add review</V2Button></DialogActions>
    </Stack>
  </Dialog>;
}
