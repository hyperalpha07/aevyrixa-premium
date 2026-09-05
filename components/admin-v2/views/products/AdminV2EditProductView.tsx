"use client";

import { Alert, Box, Button, Chip, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useActionState, useRef, useState, type FormEvent } from "react";
import { saveAdminV2DraftProduct } from "@/app/admin-v2/products/[productId]/edit/actions";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { draftEditFields, validateDraftEdit, type DraftEditField, type DraftEditState, type DraftEditValues } from "@/lib/admin-v2/product-edit";

const sections: Array<{ title: string; fields: Array<{ key: DraftEditField; label: string; rows?: number; type?: "number"; required?: boolean; helper?: string }> }> = [
  { title: "Basic information", fields: [
    { key: "name", label: "Product name", required: true },
    { key: "category", label: "Category", required: true },
    { key: "slug", label: "Slug", required: true, helper: "Lowercase letters, numbers and hyphens. Changing the name does not change this slug." },
    { key: "shortDescription", label: "Short description", rows: 2 },
  ] },
  { title: "Pricing", fields: [
    { key: "price", label: "Selling price (BDT)", type: "number", required: true },
    { key: "compareAtPrice", label: "Compare-at price (BDT)", type: "number", helper: "Optional; must exceed the selling price." },
  ] },
  { title: "Inventory basics", fields: [
    { key: "stockStatus", label: "Initial stock state", helper: "Blank is stored as Out of stock." },
    { key: "stockQuantity", label: "Initial quantity", type: "number" },
    { key: "lowStockThreshold", label: "Low-stock threshold", type: "number" },
  ] },
  { title: "Options", fields: [
    { key: "sizes", label: "Sizes", rows: 3, helper: "One size per line." },
    { key: "colors", label: "Colors", rows: 3, helper: "One color per line." },
    { key: "absorbency", label: "Absorbency" },
  ] },
  { title: "Product content", fields: [
    { key: "description", label: "Full description", rows: 5 },
    { key: "benefits", label: "Benefits", rows: 4, helper: "One benefit per line. Commas are kept within each benefit." },
    { key: "care", label: "Care guidance", rows: 4, helper: "One instruction per line." },
  ] },
  { title: "SEO", fields: [
    { key: "seoTitle", label: "SEO title" },
    { key: "seoDescription", label: "SEO description", rows: 3 },
  ] },
];

export function AdminV2EditProductUnavailable({ id, active = false }: { id: string; active?: boolean }) {
  return <Stack spacing={2}>
    <V2PageHeader title={active ? "Active product is read-only" : "Product unavailable"} titleComponent="h1" />
    <Alert severity={active ? "info" : "warning"}>
      {active ? "Only draft products can be edited here. Editing active products is coming soon."
        : "Product data could not be loaded. Reload this page to try again."}
    </Alert>
    <Box><Button component={Link} href={`/admin-v2/products/${encodeURIComponent(id)}`} variant="outlined">Back to product detail</Button></Box>
  </Stack>;
}

export function AdminV2EditProductView({ id, initialValues, supportsMerchandising }: { id: string; initialValues: DraftEditValues; supportsMerchandising: boolean }) {
  const [values, setValues] = useState(initialValues);
  const [local, setLocal] = useState<DraftEditState>({ errors: [], fields: {} });
  const [state, action, pending] = useActionState(saveAdminV2DraftProduct.bind(null, id), { errors: [], fields: {} } as DraftEditState);
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());
  const alertRef = useRef<HTMLDivElement>(null);
  const detailPath = `/admin-v2/products/${encodeURIComponent(id)}`;

  function submit(event: FormEvent<HTMLFormElement>) {
    const result = validateDraftEdit(values);
    if (!result.input) {
      event.preventDefault();
      setLocal({ errors: result.errors, fields: result.fields });
      const key = Object.keys(result.fields)[0];
      const input = key ? event.currentTarget.elements.namedItem(key) : null;
      if (input instanceof HTMLElement) input.focus();
      else alertRef.current?.focus();
    } else {
      setLocal({ errors: [], fields: {} });
      setEditedFields(new Set());
    }
  }

  const errors = local.errors.length ? local.errors : state.errors;
  return <Box component="form" action={action} onSubmit={submit} noValidate aria-busy={pending}>
    <V2PageHeader title="Edit draft product" titleComponent="h1"
      description="Update the private product record. Your changes remain in draft."
      breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Products", href: "/admin-v2/products" },
        { label: initialValues.name || "Product", href: detailPath }, { label: "Edit draft" }]}
      actions={<Chip label="Draft only" color="primary" variant="outlined" />} />
    <Stack spacing={2}>
      <Alert severity="info">This product stays private after saving. Publishing is not available yet.</Alert>
      {errors.length ? <Alert severity="error" ref={alertRef} tabIndex={-1}>
        {errors.length === 1 ? errors[0] : "Please correct the highlighted fields before saving."}
      </Alert> : null}
      {sections.map((section) => <V2Card key={section.title}>
        <Typography component="h2" variant="h6" sx={{ mb: 2 }}>{section.title}</Typography>
        <Grid container spacing={2}>
          {section.fields.map((field) => {
            if (field.key === "lowStockThreshold" && !supportsMerchandising) return <Grid key={field.key} size={{ xs: 12, md: 6 }}>
              <input type="hidden" name="lowStockThreshold" value="" />
              <TextField fullWidth size="small" label="Low-stock threshold" disabled value="" helperText="Unavailable in the current database schema." />
            </Grid>;
            const error = local.fields[field.key] || (!editedFields.has(field.key) ? state.fields[field.key] : undefined);
            return <Grid key={field.key} size={{ xs: 12, md: field.key === "description" ? 12 : 6 }}>
              <TextField fullWidth size="small" name={field.key} label={field.label}
                value={values[field.key]} required={field.required} disabled={pending}
                select={field.key === "stockStatus"} type={field.type ?? "text"}
                multiline={Boolean(field.rows)} minRows={field.rows}
                error={Boolean(error)} helperText={error || field.helper}
                onChange={(event) => {
                  setValues((current) => ({ ...current, [field.key]: event.target.value }));
                  setLocal((current) => ({ ...current, fields: { ...current.fields, [field.key]: undefined } }));
                  setEditedFields((current) => new Set(current).add(field.key));
                }}
                slotProps={{ htmlInput: { maxLength: draftEditFields[field.key],
                  ...(field.type === "number" ? { min: field.key.includes("rice") ? 0.01 : 0,
                    step: field.key.includes("rice") ? 0.01 : 1, inputMode: "decimal" } : {}) } }}>
                {field.key === "stockStatus" ? [
                  ["", "Not set"], ["in_stock", "In stock"], ["low_stock", "Low stock"],
                  ["out_of_stock", "Out of stock"], ["preorder", "Preorder"],
                ].map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>) : null}
              </TextField>
            </Grid>;
          })}
        </Grid>
      </V2Card>)}
      <V2Card><Stack spacing={1} sx={{ alignItems: "flex-start" }}>
        <Typography component="h2" variant="h6">Product media</Typography>
        <Chip label="Managed separately" size="small" variant="outlined" />
        <Typography variant="body2" color="text.secondary">Existing images are preserved. Use Manage media from product detail when you have media permission.</Typography>
      </Stack></V2Card>
      <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1} sx={{ justifyContent: "flex-end" }}>
        <Button component={Link} href={detailPath} disabled={pending} variant="outlined">Cancel</Button>
        <Button type="submit" loading={pending} variant="contained">Save draft changes</Button>
      </Stack>
    </Stack>
  </Box>;
}
