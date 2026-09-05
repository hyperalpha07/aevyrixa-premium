"use client";

import { Alert, Box, Button, Chip, Grid, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useActionState, useState } from "react";
import { unpublishAdminV2ActiveProduct, type AdminV2UnpublishActionState } from "@/app/admin-v2/products/[productId]/unpublish/actions";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { UNPUBLISH_CONFIRMATION } from "@/lib/admin-v2/product-unpublish";

type Summary = { name: string; slug: string; category: string; price: number; status: string; stockStatus: string; stockQuantity: number | null; imageCount: number };

export function AdminV2ProductUnpublishUnavailable({ id, draft = false }: { id: string; draft?: boolean }) {
  return <Stack spacing={2}>
    <V2PageHeader title={draft ? "Draft product cannot be unpublished" : "Unpublish review unavailable"} titleComponent="h1" />
    <Alert severity={draft ? "info" : "warning"}>{draft
      ? "Only active products can use this unpublish workflow. This product is already a draft."
      : "Product data could not be loaded. Reload this page to try again."}</Alert>
    <Box><Button component={Link} href={`/admin-v2/products/${encodeURIComponent(id)}`} variant="outlined">Back to product detail</Button></Box>
  </Stack>;
}

export function AdminV2ProductUnpublishView({ id, product }: { id: string; product: Summary }) {
  const [confirmation, setConfirmation] = useState("");
  const [state, action, pending] = useActionState(unpublishAdminV2ActiveProduct.bind(null, id), { errors: [] } as AdminV2UnpublishActionState);
  const detailPath = `/admin-v2/products/${encodeURIComponent(id)}`;
  return <>
    <V2PageHeader title="Unpublish product" titleComponent="h1" description="Review the storefront effect before returning this active product to draft."
      breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Products", href: "/admin-v2/products" }, { label: product.name, href: detailPath }, { label: "Unpublish" }]}
      actions={<Stack direction="row" spacing={1}><Chip label="Active product" color="success" variant="outlined" /><Chip label="Safety review" variant="outlined" /></Stack>} />
    <Stack spacing={2}>
      <Alert severity="warning">Unpublishing removes this product from the public storefront and returns it to draft.</Alert>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}><V2Card sx={{ height: "100%" }}><Typography component="h2" variant="h6" sx={{ mb: 2 }}>Product summary</Typography>
          <Grid container spacing={1.5}>{[
            ["Name", product.name], ["Slug", product.slug], ["Category", product.category || "Not set"],
            ["Price", `BDT ${product.price.toLocaleString("en-BD")}`], ["Status", product.status], ["Stock", product.stockStatus],
            ["Quantity", product.stockQuantity == null ? "Not set" : String(product.stockQuantity)], ["Images", String(product.imageCount)],
          ].map(([label, value]) => <Grid key={label} size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="body2" sx={{ fontWeight: 650, overflowWrap: "anywhere" }}>{value}</Typography></Grid>)}</Grid>
        </V2Card></Grid>
        <Grid size={{ xs: 12, lg: 7 }}><V2Card sx={{ height: "100%" }}><Typography component="h2" variant="h6" sx={{ mb: 1.5 }}>What this changes</Typography>
          <Stack component="ul" spacing={1} sx={{ pl: 2.5, my: 0 }}>
            <Typography component="li" variant="body2">The product will no longer appear on public product pages.</Typography>
            <Typography component="li" variant="body2">Product data and uploaded images will be preserved.</Typography>
            <Typography component="li" variant="body2">This does not delete or archive the product.</Typography>
            <Typography component="li" variant="body2">Draft editing, media management, and publishing remain available afterward to permitted staff.</Typography>
          </Stack>
        </V2Card></Grid>
      </Grid>
      <V2Card><Typography component="h2" variant="h6">Explicit confirmation</Typography>
        <Typography variant="body2" sx={{ mt: 1, mb: 1.5 }}>Type <strong>{UNPUBLISH_CONFIRMATION}</strong> exactly to return this active product to draft.</Typography>
        {state.errors.length ? <Alert severity="error" sx={{ mb: 1.5 }}>{state.errors[0]}</Alert> : null}
        <Box component="form" action={action}><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "flex-start" } }}>
          <TextField name="confirmation" size="small" label={`Type ${UNPUBLISH_CONFIRMATION}`} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={pending} autoComplete="off" />
          <Button type="submit" variant="contained" color="warning" loading={pending} disabled={pending || confirmation !== UNPUBLISH_CONFIRMATION}>Unpublish product</Button>
        </Stack></Box>
      </V2Card>
      <Box><Button component={Link} href={detailPath} variant="outlined">Cancel and return to product</Button></Box>
    </Stack>
  </>;
}
