"use client";

import { Alert, Box, Button, Chip, Grid, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { manageAdminV2DraftImage, uploadAdminV2DraftImage, type AdminV2MediaActionState } from "@/app/admin-v2/products/[productId]/media/actions";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { ADMIN_V2_MEDIA_MAX_BYTES, ADMIN_V2_MEDIA_MAX_MB } from "@/lib/admin-v2/product-media";

export function AdminV2ProductMediaUnavailable({ id, active = false }: { id: string; active?: boolean }) {
  return <Stack spacing={2}>
    <V2PageHeader title={active ? "Active product media is read-only" : "Product media unavailable"} titleComponent="h1" />
    <Alert severity={active ? "info" : "warning"}>{active
      ? "Only draft products can receive or manage media. Active product media remains read-only."
      : "Product data could not be loaded. Reload this page to try again."}</Alert>
    <Box><Button component={Link} href={`/admin-v2/products/${encodeURIComponent(id)}`} variant="outlined">Back to product detail</Button></Box>
  </Stack>;
}

type Notice = { uploaded: boolean; updated: string | null; cleanupFailed: boolean };

export function AdminV2ProductMediaView({ id, name, images, primaryImageUrl, notice }: { id: string; name: string; images: Array<{ value: string; src: string }>; primaryImageUrl: string | null; notice: Notice }) {
  const [state, uploadAction, pending] = useActionState(uploadAdminV2DraftImage.bind(null, id), { errors: [] } as AdminV2MediaActionState);
  const [manageState, manageAction, managing] = useActionState(manageAdminV2DraftImage.bind(null, id), { errors: [] } as AdminV2MediaActionState);
  const [clientError, setClientError] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [hasValidSelection, setHasValidSelection] = useState(false);
  const detailPath = `/admin-v2/products/${encodeURIComponent(id)}`;
  return <>
    <V2PageHeader title="Product media" titleComponent="h1" description="Upload and organize images for this private draft product."
      breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Products", href: "/admin-v2/products" },
        { label: name, href: detailPath }, { label: "Media" }]}
      actions={<Stack direction="row" spacing={1}><Chip label="Draft only" color="primary" variant="outlined" /><Chip label="Media management" variant="outlined" /></Stack>} />
    <Stack spacing={2}>
      <Alert severity="info">Draft-only media management is enabled. Publishing happens through the publish review step.</Alert>
      {notice.uploaded ? <Alert severity="success">Image uploaded and attached to this draft.</Alert> : null}
      {notice.updated ? <Alert severity="success">Draft gallery updated.</Alert> : null}
      {notice.cleanupFailed ? <Alert severity="warning">The gallery was updated, but Storage cleanup failed. The unreferenced object may need manual review.</Alert> : null}
      {manageState.errors.length ? <Alert severity="error">{manageState.errors[0]}</Alert> : null}
      <V2Card><Typography component="h2" variant="h6" sx={{ mb: 2 }}>Current gallery</Typography>
        {images.length ? <Grid container spacing={1.5}>{images.map((image, index) => <Grid key={image.value} size={{ xs: 12, sm: 6, md: 4 }}>
          <Stack spacing={1} sx={{ height: "100%", p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Box sx={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", borderRadius: 1.5, bgcolor: "action.hover" }}>
              <Image src={image.src} alt={`${name} image ${index + 1}`} fill sizes="(max-width: 600px) 100vw, 300px" style={{ objectFit: "contain" }} />
            </Box>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 650 }}>Image {index + 1}</Typography>
              {image.value === primaryImageUrl ? <Chip label="Primary" color="primary" size="small" /> : null}
            </Stack>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
              {image.value !== primaryImageUrl ? <Box component="form" action={manageAction}><input type="hidden" name="operation" value="primary" /><input type="hidden" name="imageUrl" value={image.value} />
                <Button type="submit" size="small" variant="outlined" disabled={managing}>Set primary</Button></Box> : null}
              <Box component="form" action={manageAction}><input type="hidden" name="operation" value="up" /><input type="hidden" name="imageUrl" value={image.value} />
                <Button type="submit" size="small" disabled={managing || index === 0} aria-label={`Move image ${index + 1} up`}>Move up</Button></Box>
              <Box component="form" action={manageAction}><input type="hidden" name="operation" value="down" /><input type="hidden" name="imageUrl" value={image.value} />
                <Button type="submit" size="small" disabled={managing || index === images.length - 1} aria-label={`Move image ${index + 1} down`}>Move down</Button></Box>
              <Box component="form" action={manageAction} onSubmit={(event) => { if (!window.confirm(`Remove image ${index + 1} from this draft gallery?`)) event.preventDefault(); }}>
                <input type="hidden" name="operation" value="remove" /><input type="hidden" name="imageUrl" value={image.value} />
                <Button type="submit" size="small" color="error" disabled={managing}>Remove</Button></Box>
            </Stack>
          </Stack>
        </Grid>)}</Grid> : <Alert severity="info">No product images are attached yet. The first successful upload will become the primary image.</Alert>}
      </V2Card>
      <V2Card><Typography component="h2" variant="h6">Upload image</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>JPG, PNG, or WebP only. Maximum {ADMIN_V2_MEDIA_MAX_MB} MB.</Typography>
        {clientError || state.errors.length ? <Alert severity="error" sx={{ mb: 2 }}>{clientError || state.errors[0]}</Alert> : null}
        <Box component="form" action={uploadAction} onSubmit={(event) => {
          const input = event.currentTarget.elements.namedItem("file");
          const file = input instanceof HTMLInputElement ? input.files?.[0] : null;
          if (!file || file.size <= 0 || file.size > ADMIN_V2_MEDIA_MAX_BYTES || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            event.preventDefault(); setClientError(`Choose a JPG, PNG, or WebP image that is ${ADMIN_V2_MEDIA_MAX_MB} MB or smaller.`);
          } else setClientError("");
        }}><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
          <Button component="label" variant="outlined" disabled={pending}>Choose image<input name="file" type="file" hidden required accept="image/jpeg,image/png,image/webp" onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            setSelectedFileName(file?.name ?? "");
            const valid = Boolean(file && file.size > 0 && file.size <= ADMIN_V2_MEDIA_MAX_BYTES && ["image/jpeg", "image/png", "image/webp"].includes(file.type));
            setHasValidSelection(valid);
            setClientError(file && !valid ? `Choose a non-empty JPG, PNG, or WebP image that is ${ADMIN_V2_MEDIA_MAX_MB} MB or smaller.` : "");
          }} /></Button>
          <Typography variant="body2" color={selectedFileName ? "text.primary" : "text.secondary"} sx={{ overflowWrap: "anywhere" }}>{selectedFileName || "No file selected"}</Typography>
          <Button type="submit" variant="contained" loading={pending} disabled={pending || !hasValidSelection}>Upload image to draft</Button>
        </Stack></Box>
      </V2Card>
      <Alert severity="info">Active product media remains read-only. Description images and rich product content are coming in a later phase.</Alert>
      <Box><Button component={Link} href={detailPath} variant="outlined">Back to product detail</Button></Box>
    </Stack>
  </>;
}
