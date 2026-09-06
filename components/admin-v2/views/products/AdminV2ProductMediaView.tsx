"use client";

import { Alert, Box, Button, Chip, FormControl, InputLabel, MenuItem, Select, Grid, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { manageAdminV2DraftImage, uploadAdminV2DraftImage, type AdminV2MediaActionState } from "@/app/admin-v2/products/[productId]/media/actions";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { ADMIN_V2_MEDIA_MAX_BYTES, ADMIN_V2_MEDIA_MAX_MB, type AdminV2RichMediaRole } from "@/lib/admin-v2/product-media";

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
const richMediaRoles: Array<{ role: AdminV2RichMediaRole; label: string }> = [
  { role: "description", label: "Description image" },
  { role: "sizeChart", label: "Size chart" },
  { role: "careGuide", label: "Care guide" },
  { role: "feature1", label: "Feature image 1" },
  { role: "feature2", label: "Feature image 2" },
  { role: "feature3", label: "Feature image 3" },
];

export function AdminV2ProductMediaView({ id, name, images, primaryImageUrl, colors, colorAssignments, supportsColorMedia, richAssignments, supportsRichMedia, notice }: {
  id: string;
  name: string;
  images: Array<{ value: string; src: string }>;
  primaryImageUrl: string | null;
  colors: string[];
  colorAssignments: Record<string, string>;
  supportsColorMedia: boolean;
  richAssignments: Record<AdminV2RichMediaRole, string>;
  supportsRichMedia: boolean;
  notice: Notice;
}) {
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
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                {colorAssignments[image.value] ? <Chip label={colorAssignments[image.value]} size="small" variant="outlined" /> : null}
                {image.value === primaryImageUrl ? <Chip label="Primary" color="primary" size="small" /> : null}
              </Stack>
            </Stack>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
              {image.value !== primaryImageUrl ? <Box component="form" action={manageAction}><input type="hidden" name="operation" value="primary" /><input type="hidden" name="imageUrl" value={image.value} />
                <Button type="submit" size="small" variant="outlined" disabled={managing}>Set primary</Button></Box> : null}
              {index > 0 ? <Box component="form" action={manageAction}><input type="hidden" name="operation" value="up" /><input type="hidden" name="imageUrl" value={image.value} />
                <Button type="submit" size="small" disabled={managing} aria-label={`Move image ${index + 1} up`}>Move up</Button></Box> : null}
              {index < images.length - 1 ? <Box component="form" action={manageAction}><input type="hidden" name="operation" value="down" /><input type="hidden" name="imageUrl" value={image.value} />
                <Button type="submit" size="small" disabled={managing} aria-label={`Move image ${index + 1} down`}>Move down</Button></Box> : null}
              <Box component="form" action={manageAction} onSubmit={(event) => { if (!window.confirm(`Remove image ${index + 1} from this draft gallery?`)) event.preventDefault(); }}>
                <input type="hidden" name="operation" value="remove" /><input type="hidden" name="imageUrl" value={image.value} />
                <Button type="submit" size="small" color="error" disabled={managing}>Remove</Button></Box>
            </Stack>
            {supportsColorMedia && colors.length ? <Stack component="form" action={manageAction} direction={{ xs: "column", sm: "row" }} spacing={1}>
              <input type="hidden" name="operation" value="color" />
              <input type="hidden" name="imageUrl" value={image.value} />
              <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
                <InputLabel id={`image-${index}-color-label`}>Product color</InputLabel>
                <Select name="color" labelId={`image-${index}-color-label`} label="Product color" defaultValue={colorAssignments[image.value] ?? ""}>
                  <MenuItem value="">None</MenuItem>
                  {colors.map((color) => <MenuItem key={color} value={color}>{color}</MenuItem>)}
                </Select>
              </FormControl>
              <Button type="submit" size="small" variant="outlined" disabled={managing}>Save color</Button>
            </Stack> : null}
          </Stack>
        </Grid>)}</Grid> : <Alert severity="info">No product images are attached yet. The first successful upload will become the primary image.</Alert>}
      </V2Card>
      {!supportsColorMedia ? <Alert severity="info">Color-specific image assignment needs a product metadata field and will be added after schema support.</Alert> : null}
      <V2Card>
        <Typography component="h2" variant="h6">Rich product content</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          Assign existing gallery images to the public description, size, care, and feature sections. Gallery and color assignments remain separate.
        </Typography>
        {supportsRichMedia ? <Grid container spacing={1.5}>{richMediaRoles.map(({ role, label }) => <Grid key={role} size={{ xs: 12, md: 6 }}>
          <Stack component="form" action={manageAction} direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
            <input type="hidden" name="operation" value="rich" />
            <input type="hidden" name="role" value={role} />
            <FormControl size="small" sx={{ minWidth: 190, flex: 1 }}>
              <InputLabel id={`rich-${role}-label`}>{label}</InputLabel>
              <Select name="imageUrl" labelId={`rich-${role}-label`} label={label} defaultValue={richAssignments[role] ?? ""}>
                <MenuItem value="">None</MenuItem>
                {images.map((image, index) => <MenuItem key={image.value} value={image.value}>Image {index + 1}</MenuItem>)}
              </Select>
            </FormControl>
            <Button type="submit" size="small" variant="outlined" disabled={managing}>Save</Button>
          </Stack>
        </Grid>)}</Grid> : <Alert severity="info">Rich content assignment needs the existing product media metadata field.</Alert>}
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
      <Alert severity="info">Gallery images can be uploaded, removed, reordered, assigned to colors, and reused in rich product content. Separate inline uploads remain a later phase.</Alert>
      <Box><Button component={Link} href={detailPath} variant="outlined">Back to product detail</Button></Box>
    </Stack>
  </>;
}
