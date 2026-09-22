"use client";

import { Alert, Box, Chip, Divider, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { ChevronDown, ImagePlus, LockKeyhole, PackagePlus } from "lucide-react";
import { type FormEvent, type ReactNode, useActionState, useEffect, useRef, useState } from "react";
import { createAdminV2DraftProductAction, type AdminV2CreateProductActionState } from "@/app/admin-v2/products/new/actions";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { slugifyAdminV2ProductName, validateAdminV2DraftProduct, type AdminV2DraftProductField } from "@/lib/admin-v2/product-create";

const initialState: AdminV2CreateProductActionState = { errors: [], fields: {} };
type FieldErrors = Partial<Record<AdminV2DraftProductField, string>>;

function Disclosure({ title, fields, children }: { title: string; fields: string; children: ReactNode }) {
  return <Box component="details" data-fields={fields} sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1.5, "&[open] .new-product-chevron": { transform: "rotate(180deg)" } }}>
    <Box component="summary" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, cursor: "pointer", listStyle: "none", "&::-webkit-details-marker": { display: "none" } }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
      <ChevronDown className="new-product-chevron" size={18} aria-hidden="true" />
    </Box>
    <Box sx={{ pb: 2, pt: 1 }}>{children}</Box>
  </Box>;
}

export function AdminV2NewProductView({ canManageMedia }: { canManageMedia: boolean }) {
  const [state, formAction, pending] = useActionState(createAdminV2DraftProductAction, initialState);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [clientFields, setClientFields] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  const fieldError = (field: AdminV2DraftProductField) => clientFields[field] ?? state.fields[field];
  const clearFieldError = (field: AdminV2DraftProductField) => setClientFields((current) => ({ ...current, [field]: undefined }));

  const revealAndFocus = (field: string, form: HTMLFormElement) => {
    for (const disclosure of form.querySelectorAll<HTMLDetailsElement>("details[data-fields]")) {
      if (disclosure.dataset.fields?.split(" ").includes(field)) disclosure.open = true;
    }
    requestAnimationFrame(() => (form.elements.namedItem(field) as HTMLElement | null)?.focus());
  };

  useEffect(() => {
    const firstField = Object.keys(state.fields)[0];
    if (firstField && formRef.current) revealAndFocus(firstField, formRef.current);
  }, [state.fields]);

  const handleNameChange = (value: string) => {
    setName(value);
    clearFieldError("name");
    if (!slugEdited) {
      setSlug(slugifyAdminV2ProductName(value));
      clearFieldError("slug");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const validation = validateAdminV2DraftProduct(Object.fromEntries(new FormData(event.currentTarget).entries()));
    if (!validation.input) {
      event.preventDefault();
      setClientFields(validation.fields);
      const firstField = Object.keys(validation.fields)[0];
      if (firstField) revealAndFocus(firstField, event.currentTarget);
      return;
    }
    setClientFields({});
  };

  return <Box component="form" ref={formRef} action={formAction} onSubmit={handleSubmit} noValidate>
    <V2PageHeader title="New Product" titleComponent="h1" description="Add the essentials now. You can finish the details before publishing."
      breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Products", href: "/admin-v2/products" }, { label: "New Product" }]}
      actions={<Chip icon={<LockKeyhole size={15} />} label="Creates as Draft" color="primary" variant="outlined" />} />

    {state.errors.length ? <Alert severity="error" role="alert" sx={{ mb: 2 }}>{state.errors[0]}</Alert> : null}

    <V2Card sx={{ maxWidth: 1160, mx: "auto" }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography component="h2" variant="h6">Product essentials</Typography>
          <Typography variant="body2" color="text.secondary">A private draft is created first.</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}><TextField fullWidth size="small" required name="name" label="Product name" value={name}
            onChange={(event) => handleNameChange(event.target.value)} error={Boolean(fieldError("name"))} helperText={fieldError("name")}
            slotProps={{ htmlInput: { maxLength: 180 } }} /></Grid>
          <Grid size={{ xs: 12, md: 5 }}><TextField fullWidth size="small" required name="category" label="Category"
            error={Boolean(fieldError("category"))} helperText={fieldError("category")} onChange={() => clearFieldError("category")}
            slotProps={{ htmlInput: { maxLength: 120 } }} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth size="small" required type="number" name="price" label="Selling price (BDT)"
            error={Boolean(fieldError("price"))} helperText={fieldError("price")} onChange={() => clearFieldError("price")}
            slotProps={{ htmlInput: { min: 0.01, step: 0.01, inputMode: "decimal" } }} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField select fullWidth size="small" name="stockStatus" label="Stock status" defaultValue="">
            <MenuItem value="">Not set (Out of stock)</MenuItem><MenuItem value="in_stock">In stock</MenuItem>
            <MenuItem value="low_stock">Low stock</MenuItem><MenuItem value="out_of_stock">Out of stock</MenuItem>
            <MenuItem value="preorder">Preorder</MenuItem>
          </TextField></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth size="small" type="number" name="stockQuantity" label="Stock quantity"
            error={Boolean(fieldError("stockQuantity"))} helperText={fieldError("stockQuantity")}
            onChange={() => clearFieldError("stockQuantity")}
            slotProps={{ htmlInput: { min: 0, step: 1, inputMode: "numeric" } }} /></Grid>
          <Grid size={{ xs: 12 }}><TextField fullWidth size="small" multiline minRows={2} name="shortDescription"
            label="Short description" slotProps={{ htmlInput: { maxLength: 500 } }} /></Grid>
        </Grid>

        <Divider />
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <ImagePlus size={20} aria-hidden="true" />
          <Box><Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>Product image</Typography>
            <Typography variant="body2" color="text.secondary">
              {canManageMedia ? "After creating the draft, you will go straight to image upload." : "After creating the draft, a teammate with media access can add images."}
            </Typography></Box>
        </Stack>

        <Box>
          <Disclosure title="More pricing options" fields="compareAtPrice">
            <TextField fullWidth size="small" type="number" name="compareAtPrice" label="Compare-at price (BDT)"
              error={Boolean(fieldError("compareAtPrice"))} helperText={fieldError("compareAtPrice") ?? "Optional; must exceed selling price."}
              onChange={() => clearFieldError("compareAtPrice")}
              slotProps={{ htmlInput: { min: 0.01, step: 0.01, inputMode: "decimal" } }} />
          </Disclosure>
          <Disclosure title="Product options" fields="sizes colors absorbency">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth size="small" multiline minRows={2} name="sizes" label="Sizes" helperText="Comma-separated, e.g. S, M, L" /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth size="small" multiline minRows={2} name="colors" label="Colors" helperText="Comma-separated, e.g. Black, Nude" /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth size="small" name="absorbency" label="Absorbency" slotProps={{ htmlInput: { maxLength: 120 } }} /></Grid>
            </Grid>
          </Disclosure>
          <Disclosure title="Description & care" fields="description benefits care">
            <Stack spacing={2}>
              <TextField fullWidth size="small" multiline minRows={4} name="description" label="Full description" slotProps={{ htmlInput: { maxLength: 10000 } }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth size="small" multiline minRows={3} name="benefits" label="Benefits" helperText="Comma-separated values" /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth size="small" multiline minRows={3} name="care" label="Care guidance" helperText="Comma-separated values" /></Grid>
              </Grid>
            </Stack>
          </Disclosure>
          <Disclosure title="SEO settings" fields="seoTitle seoDescription">
            <Stack spacing={2}>
              <TextField fullWidth size="small" name="seoTitle" label="SEO title" slotProps={{ htmlInput: { maxLength: 180 } }} />
              <TextField fullWidth size="small" multiline minRows={3} name="seoDescription" label="SEO description" slotProps={{ htmlInput: { maxLength: 500 } }} />
            </Stack>
          </Disclosure>
          <Disclosure title="Advanced" fields="slug lowStockThreshold">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 7 }}><TextField fullWidth size="small" name="slug" label="URL slug" value={slug}
                onChange={(event) => { setSlug(event.target.value); setSlugEdited(true); clearFieldError("slug"); }}
                error={Boolean(fieldError("slug"))} helperText={fieldError("slug") ?? "Generated from the product name unless edited here."}
                slotProps={{ htmlInput: { maxLength: 160, pattern: "[a-z0-9]+(?:-[a-z0-9]+)*" } }} /></Grid>
              <Grid size={{ xs: 12, md: 5 }}><TextField fullWidth size="small" type="number" name="lowStockThreshold" label="Low-stock threshold"
                error={Boolean(fieldError("lowStockThreshold"))} helperText={fieldError("lowStockThreshold")}
                onChange={() => clearFieldError("lowStockThreshold")}
                slotProps={{ htmlInput: { min: 0, step: 1, inputMode: "numeric" } }} /></Grid>
            </Grid>
          </Disclosure>
        </Box>

        <Divider />
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
          <V2Button href="/admin-v2/products" variant="outlined" disabled={pending}>Cancel</V2Button>
          <V2Button type="submit" variant="contained" loading={pending} startIcon={<PackagePlus size={17} />}>Create Product</V2Button>
        </Stack>
      </Stack>
    </V2Card>
  </Box>;
}
