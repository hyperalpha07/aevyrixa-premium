"use client";

import { Alert, Box, Button, Chip, Grid, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { uploadAdminV2DraftImage, type AdminV2MediaActionState } from "@/app/admin-v2/products/[productId]/media/actions";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";

export function AdminV2ProductMediaUnavailable({ id, active = false }: { id: string; active?: boolean }) {
  return <Stack spacing={2}>
    <V2PageHeader title={active ? "Active product media is read-only" : "Product media unavailable"} titleComponent="h1" />
    <Alert severity={active ? "info" : "warning"}>{active
      ? "Only draft products can receive new media. Active product media editing is coming later."
      : "Product data could not be loaded. Reload this page to try again."}</Alert>
    <Box><Button component={Link} href={`/admin-v2/products/${encodeURIComponent(id)}`} variant="outlined">Back to product detail</Button></Box>
  </Stack>;
}

export function AdminV2ProductMediaView({ id, name, images }: { id: string; name: string; images: string[] }) {
  const [state, action, pending] = useActionState(uploadAdminV2DraftImage.bind(null, id), { errors: [] } as AdminV2MediaActionState);
  const [clientError, setClientError] = useState("");
  const detailPath = `/admin-v2/products/${encodeURIComponent(id)}`;
  return <>
    <V2PageHeader title="Product media" titleComponent="h1" description="Upload images to this private draft product."
      breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Products", href: "/admin-v2/products" },
        { label: name, href: detailPath }, { label: "Media" }]}
      actions={<Stack direction="row" spacing={1}><Chip label="Draft only" color="primary" variant="outlined" /><Chip label="Media phase" variant="outlined" /></Stack>} />
    <Stack spacing={2}>
      <Alert severity="info">Images remain private while this product is a draft. Publishing is not available here.</Alert>
      <V2Card><Typography component="h2" variant="h6" sx={{ mb: 2 }}>Current gallery</Typography>
        {images.length ? <Grid container spacing={1.5}>{images.map((url, index) => <Grid key={url} size={{ xs: 6, sm: 4, md: 3 }}>
          <Box sx={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "action.hover" }}>
            <Image src={url} alt={`${name} image ${index + 1}`} fill sizes="(max-width: 600px) 50vw, 220px" style={{ objectFit: "contain" }} />
          </Box>
        </Grid>)}</Grid> : <Alert severity="info">No product images are attached yet. The first successful upload will become the primary image.</Alert>}
      </V2Card>
      <V2Card><Typography component="h2" variant="h6">Upload image</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>JPG, PNG, or WebP only. Maximum 5 MB.</Typography>
        {clientError || state.errors.length ? <Alert severity="error" sx={{ mb: 2 }}>{clientError || state.errors[0]}</Alert> : null}
        <Box component="form" action={action} onSubmit={(event) => {
          const input = event.currentTarget.elements.namedItem("file");
          const file = input instanceof HTMLInputElement ? input.files?.[0] : null;
          if (!file || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            event.preventDefault(); setClientError("Choose a JPG, PNG, or WebP image that is 5 MB or smaller.");
          } else setClientError("");
        }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
            <Button component="label" variant="outlined" disabled={pending}>Choose image<input name="file" type="file" hidden required accept="image/jpeg,image/png,image/webp" /></Button>
            <Button type="submit" variant="contained" loading={pending}>Upload image to draft</Button>
          </Stack>
        </Box>
      </V2Card>
      <Alert severity="info">Delete, reorder, and set-primary controls are coming later. Active product media remains read-only.</Alert>
      <Box><Button component={Link} href={detailPath} variant="outlined">Back to product detail</Button></Box>
    </Stack>
  </>;
}
