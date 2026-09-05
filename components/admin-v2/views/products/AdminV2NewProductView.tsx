"use client";

import {
  Alert,
  Box,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ImagePlus, LockKeyhole, PackagePlus } from "lucide-react";
import { type FormEvent, useActionState, useState } from "react";
import {
  createAdminV2DraftProductAction,
  type AdminV2CreateProductActionState,
} from "@/app/admin-v2/products/new/actions";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import {
  slugifyAdminV2ProductName,
  validateAdminV2DraftProduct,
  type AdminV2DraftProductField,
} from "@/lib/admin-v2/product-create";

const initialState: AdminV2CreateProductActionState = { errors: [], fields: {} };

type FieldErrors = Partial<Record<AdminV2DraftProductField, string>>;

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <Box>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
        {description}
      </Typography>
    </Box>
  );
}

function listHelper(example: string) {
  return `Separate values with commas or new lines. Example: ${example}`;
}

export function AdminV2NewProductView() {
  const [state, formAction, pending] = useActionState(
    createAdminV2DraftProductAction,
    initialState
  );
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [clientFields, setClientFields] = useState<FieldErrors>({});

  const fieldError = (name: AdminV2DraftProductField) =>
    clientFields[name] ?? state.fields[name];

  const clearFieldError = (field: AdminV2DraftProductField) => {
    setClientFields((current) => ({ ...current, [field]: undefined }));
  };

  const handleNameChange = (value: string) => {
    setName(value);
    clearFieldError("name");
    if (!slugEdited) {
      setSlug(slugifyAdminV2ProductName(value));
      clearFieldError("slug");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const validation = validateAdminV2DraftProduct(Object.fromEntries(formData.entries()));
    if (!validation.input) {
      event.preventDefault();
      setClientFields(validation.fields);
      const firstField = Object.keys(validation.fields)[0];
      const firstInvalid = firstField
        ? (event.currentTarget.elements.namedItem(firstField) as HTMLElement | null)
        : null;
      firstInvalid?.focus();
      return;
    }
    setClientFields({});
  };

  return (
    <Box component="form" action={formAction} onSubmit={handleSubmit} noValidate>
      <V2PageHeader
        title="New Product"
        titleComponent="h1"
        description="Create a private draft product record. Publishing and media management are not available in this phase."
        breadcrumbs={[
          { label: "Admin V2", href: "/admin-v2/dashboard" },
          { label: "Products", href: "/admin-v2/products" },
          { label: "New Product" },
        ]}
        actions={
          <Chip
            icon={<LockKeyhole size={15} />}
            label="Draft only"
            color="primary"
            variant="outlined"
          />
        }
      />

      <Stack spacing={2.25}>
        <Alert severity="info">
          Every product created here is forced to Draft on the server and remains unavailable on
          the public storefront until a future publish workflow is implemented.
        </Alert>

        {state.errors.length > 0 ? (
          <Alert severity="error" role="alert">
            {state.errors.length === 1
              ? state.errors[0]
              : `Please correct ${state.errors.length} fields before creating this draft.`}
          </Alert>
        ) : null}

        <V2Card>
          <Stack spacing={2.25}>
            <SectionTitle
              title="Basic information"
              description="The customer-facing identity can be refined later while the record remains a draft."
            />
            <Divider />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 7 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  name="name"
                  label="Product name"
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  error={Boolean(fieldError("name"))}
                  helperText={fieldError("name") ?? "Use a clear, customer-friendly name."}
                  slotProps={{ htmlInput: { maxLength: 180 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  name="category"
                  label="Category"
                  error={Boolean(fieldError("category"))}
                  helperText={fieldError("category") ?? "Example: Reusable Period Panty"}
                  onChange={() => clearFieldError("category")}
                  slotProps={{ htmlInput: { maxLength: 120 } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  name="slug"
                  label="Slug"
                  value={slug}
                  onChange={(event) => {
                    setSlug(event.target.value);
                    setSlugEdited(true);
                    clearFieldError("slug");
                  }}
                  error={Boolean(fieldError("slug"))}
                  helperText={
                    fieldError("slug") ??
                    "Generated from the name. Use lowercase letters, numbers, and hyphens."
                  }
                  slotProps={{ htmlInput: { maxLength: 160, pattern: "[a-z0-9]+(?:-[a-z0-9]+)*" } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  name="shortDescription"
                  label="Short description"
                  helperText="Optional. Keep this concise for future catalog use."
                  slotProps={{ htmlInput: { maxLength: 500 } }}
                />
              </Grid>
            </Grid>
          </Stack>
        </V2Card>

        <Grid container spacing={2.25}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <V2Card sx={{ height: "100%" }}>
              <Stack spacing={2.25}>
                <SectionTitle
                  title="Pricing"
                  description="Set the initial selling price without publishing the product."
                />
                <Divider />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      type="number"
                      name="price"
                      label="Selling price (BDT)"
                      error={Boolean(fieldError("price"))}
                      helperText={fieldError("price") ?? "Must be greater than zero."}
                      onChange={() => clearFieldError("price")}
                      slotProps={{ htmlInput: { min: 0.01, step: 0.01, inputMode: "decimal" } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      name="compareAtPrice"
                      label="Compare-at price (BDT)"
                      error={Boolean(fieldError("compareAtPrice"))}
                      helperText={fieldError("compareAtPrice") ?? "Optional; must exceed selling price."}
                      onChange={() => clearFieldError("compareAtPrice")}
                      slotProps={{ htmlInput: { min: 0.01, step: 0.01, inputMode: "decimal" } }}
                    />
                  </Grid>
                </Grid>
              </Stack>
            </V2Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <V2Card sx={{ height: "100%" }}>
              <Stack spacing={2.25}>
                <SectionTitle
                  title="Inventory basics"
                  description="Optional starting values only; ongoing inventory adjustment is still unavailable."
                />
                <Divider />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField select fullWidth size="small" name="stockStatus" label="Stock state" defaultValue="">
                      <MenuItem value="">Not set</MenuItem>
                      <MenuItem value="in_stock">In stock</MenuItem>
                      <MenuItem value="low_stock">Low stock</MenuItem>
                      <MenuItem value="out_of_stock">Out of stock</MenuItem>
                      <MenuItem value="preorder">Preorder</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      name="stockQuantity"
                      label="Stock quantity"
                      error={Boolean(fieldError("stockQuantity"))}
                      helperText={fieldError("stockQuantity")}
                      onChange={() => clearFieldError("stockQuantity")}
                      slotProps={{ htmlInput: { min: 0, step: 1, inputMode: "numeric" } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      name="lowStockThreshold"
                      label="Low-stock threshold"
                      error={Boolean(fieldError("lowStockThreshold"))}
                      helperText={fieldError("lowStockThreshold")}
                      onChange={() => clearFieldError("lowStockThreshold")}
                      slotProps={{ htmlInput: { min: 0, step: 1, inputMode: "numeric" } }}
                    />
                  </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary">
                  If stock state is not set, the draft is stored as Out of stock for launch safety.
                </Typography>
              </Stack>
            </V2Card>
          </Grid>
        </Grid>

        <V2Card>
          <Stack spacing={2.25}>
            <SectionTitle
              title="Options"
              description="Add only verified options. Values are trimmed and duplicates are removed."
            />
            <Divider />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth size="small" multiline minRows={2} name="sizes" label="Sizes" helperText={listHelper("S, M, L")} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth size="small" multiline minRows={2} name="colors" label="Colors" helperText={listHelper("Black, Nude")} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth size="small" name="absorbency" label="Absorbency" helperText="Optional. Leave blank unless verified." slotProps={{ htmlInput: { maxLength: 120 } }} />
              </Grid>
            </Grid>
          </Stack>
        </V2Card>

        <V2Card>
          <Stack spacing={2.25}>
            <SectionTitle
              title="Product content"
              description="Optional draft copy. Product facts and claims should remain evidence-based."
            />
            <Divider />
            <TextField fullWidth size="small" multiline minRows={5} name="description" label="Full description" slotProps={{ htmlInput: { maxLength: 10000 } }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth size="small" multiline minRows={3} name="benefits" label="Benefits" helperText={listHelper("Breathable comfort, Flexible waistband")} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth size="small" multiline minRows={3} name="care" label="Care guidance" helperText={listHelper("Wash before first use, Air dry")} />
              </Grid>
            </Grid>
          </Stack>
        </V2Card>

        <Grid container spacing={2.25}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <V2Card sx={{ height: "100%" }}>
              <Stack spacing={2.25}>
                <SectionTitle title="SEO" description="Optional search-preview copy for a future publishing phase." />
                <Divider />
                <TextField fullWidth size="small" name="seoTitle" label="SEO title" slotProps={{ htmlInput: { maxLength: 180 } }} />
                <TextField fullWidth size="small" multiline minRows={3} name="seoDescription" label="SEO description" slotProps={{ htmlInput: { maxLength: 500 } }} />
              </Stack>
            </V2Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <V2Card sx={{ height: "100%", bgcolor: "action.hover" }}>
              <Stack spacing={1.5} sx={{ height: "100%", justifyContent: "center", alignItems: "flex-start" }}>
                <ImagePlus size={24} aria-hidden="true" />
                <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
                  Product media
                </Typography>
                <Chip label="Coming soon" size="small" variant="outlined" />
                <Typography variant="body2" color="text.secondary">
                  Create the draft first. Image upload, gallery editing, and media ordering remain disabled in this phase.
                </Typography>
              </Stack>
            </V2Card>
          </Grid>
        </Grid>

        <V2Card>
          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            spacing={1.25}
            sx={{ alignItems: { sm: "center" }, justifyContent: "flex-end" }}
          >
            <V2Button href="/admin-v2/products" variant="outlined" disabled={pending}>
              Cancel
            </V2Button>
            <V2Button
              type="submit"
              variant="contained"
              loading={pending}
              startIcon={<PackagePlus size={17} />}
            >
              Create draft product
            </V2Button>
          </Stack>
        </V2Card>
      </Stack>
    </Box>
  );
}
