"use client";

import { Alert, Box, Button, Chip, Grid, Stack, TextField, Typography } from "@mui/material";
import { CheckCircle2, CircleAlert } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { publishAdminV2DraftProduct, type AdminV2PublishActionState } from "@/app/admin-v2/products/[productId]/publish/actions";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { PUBLISH_CONFIRMATION, type PublishCheck, type PublishWarning } from "@/lib/admin-v2/product-publish";

type Summary = { name: string; slug: string; category: string; price: number; compareAtPrice: number | null; status: string; stockStatus: string; stockQuantity: number | null; imageCount: number };

export function AdminV2ProductPublishUnavailable({ id, active = false }: { id: string; active?: boolean }) {
  return <Stack spacing={2}>
    <V2PageHeader title={active ? "Active product cannot be published again" : "Publish review unavailable"} titleComponent="h1" />
    <Alert severity={active ? "info" : "warning"}>{active
      ? "Only draft products can use this publish workflow. Active products remain read-only."
      : "Product data could not be loaded. Reload this page to try again."}</Alert>
    <Box><Button component={Link} href={`/admin-v2/products/${encodeURIComponent(id)}`} variant="outlined">Back to product detail</Button></Box>
  </Stack>;
}

function CheckList({ checks, id }: { checks: PublishCheck[]; id: string }) {
  return <Stack spacing={1}>{checks.map((check) => <Stack key={check.key} direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
    {check.passed ? <CheckCircle2 size={20} color="var(--mui-palette-success-main)" aria-hidden="true" />
      : <CircleAlert size={20} color="var(--mui-palette-error-main)" aria-hidden="true" />}
    <Box sx={{ flex: 1 }}><Typography variant="body2" sx={{ fontWeight: 650 }}>{check.label}</Typography>
      <Typography variant="caption" color="text.secondary">{check.passed ? "Ready" : check.detail}</Typography></Box>
    {!check.passed && check.action ? <Button component={Link} size="small" href={`/admin-v2/products/${encodeURIComponent(id)}/${check.action}`}>Fix</Button> : null}
  </Stack>)}</Stack>;
}

function WarningList({ warnings }: { warnings: PublishWarning[] }) {
  return warnings.length ? <Stack spacing={1}>{warnings.map((warning) => <Alert key={warning.key} severity="warning" sx={{ py: 0.25 }}>
    <strong>{warning.label}.</strong> {warning.detail}
  </Alert>)}</Stack> : <Alert severity="success">No optional publish warnings.</Alert>;
}

export function AdminV2ProductPublishView({ id, product, readiness }: { id: string; product: Summary; readiness: { checks: PublishCheck[]; warnings: PublishWarning[]; ready: boolean } }) {
  const [confirmation, setConfirmation] = useState("");
  const [state, action, pending] = useActionState(publishAdminV2DraftProduct.bind(null, id), { errors: [] } as AdminV2PublishActionState);
  const detailPath = `/admin-v2/products/${encodeURIComponent(id)}`;
  const publicPath = `/product/${encodeURIComponent(product.slug)}`;
  return <>
    <V2PageHeader title="Publish product" titleComponent="h1" description="Review every required check before making this product public."
      breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Products", href: "/admin-v2/products" },
        { label: product.name, href: detailPath }, { label: "Publish" }]}
      actions={<Stack direction="row" spacing={1}><Chip label="Draft only" color="primary" variant="outlined" /><Chip label="Publish review" variant="outlined" /></Stack>} />
    <Stack spacing={2}>
      <Alert severity="warning">Publishing will make this product visible on the public storefront at {publicPath}.</Alert>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}><V2Card sx={{ height: "100%" }}><Typography component="h2" variant="h6" sx={{ mb: 2 }}>Product summary</Typography>
          <Grid container spacing={1.5}>{[
            ["Name", product.name], ["Slug", product.slug], ["Category", product.category || "Missing"],
            ["Price", `BDT ${Number.isFinite(product.price) ? product.price.toLocaleString("en-BD") : "Invalid"}`],
            ["Compare at", product.compareAtPrice == null ? "Not set" : `BDT ${product.compareAtPrice.toLocaleString("en-BD")}`],
            ["Status", product.status], ["Stock", product.stockStatus],
            ["Quantity", product.stockQuantity == null ? "Not set" : String(product.stockQuantity)], ["Images", String(product.imageCount)],
            ["Future public URL", publicPath],
          ].map(([label, value]) => <Grid key={label} size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="body2" sx={{ fontWeight: 650, overflowWrap: "anywhere" }}>{value}</Typography></Grid>)}</Grid>
        </V2Card></Grid>
        <Grid size={{ xs: 12, lg: 7 }}><V2Card sx={{ height: "100%" }}><Typography component="h2" variant="h6" sx={{ mb: 2 }}>Required checks</Typography><CheckList checks={readiness.checks} id={id} /></V2Card></Grid>
      </Grid>
      <V2Card><Typography component="h2" variant="h6" sx={{ mb: 1.5 }}>Optional warnings</Typography><WarningList warnings={readiness.warnings} /></V2Card>
      <V2Card><Typography component="h2" variant="h6">Explicit confirmation</Typography>
        {!readiness.ready ? <Alert severity="error" sx={{ mt: 1.5 }}>Resolve every failed required check before publishing.</Alert> : <>
          <Typography variant="body2" sx={{ mt: 1, mb: 1.5 }}>Type <strong>{PUBLISH_CONFIRMATION}</strong> exactly. This changes the product from draft to active.</Typography>
          {state.errors.length ? <Alert severity="error" sx={{ mb: 1.5 }}>{state.errors[0]}</Alert> : null}
          <Box component="form" action={action}><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "flex-start" } }}>
            <TextField name="confirmation" size="small" label={`Type ${PUBLISH_CONFIRMATION}`} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={pending} autoComplete="off" />
            <Button type="submit" variant="contained" color="warning" loading={pending} disabled={pending || confirmation !== PUBLISH_CONFIRMATION}>Publish product</Button>
          </Stack></Box>
        </>}
      </V2Card>
      <Box><Button component={Link} href={detailPath} variant="outlined">Cancel and return to product</Button></Box>
    </Stack>
  </>;
}
