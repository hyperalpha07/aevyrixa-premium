"use client";

import {
  Alert,
  Box,
  ButtonBase,
  Chip,
  Divider,
  Grid,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  ExternalLink,
  ImageOff,
  Package,
  SearchCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type {
  AdminV2ProductDetail,
  AdminV2ProductDetailData,
} from "@/lib/admin-v2/products";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";

const stockLabels = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
  preorder: "Preorder",
} as const;

const stockColors = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "error",
  preorder: "info",
} as const;

function formatPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: currency || "BDT",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency || "BDT"} ${value.toLocaleString("en-BD")}`;
  }
}

function formatDate(value: string | null) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
    timeZoneName: "short",
  }).format(date);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography component="div" variant="body2" sx={{ mt: 0.25, overflowWrap: "anywhere" }}>
        {children}
      </Typography>
    </Box>
  );
}

function EmptyValue({ children }: { children: string }) {
  return <Typography color="text.secondary" variant="body2">{children}</Typography>;
}

function ProductMediaGallery({ product }: { product: AdminV2ProductDetail }) {
  const [selectedUrl, setSelectedUrl] = useState(product.imageUrls[0] ?? "");
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const visibleImages = product.imageUrls.filter((url) => !failedUrls.includes(url));
  const activeUrl = visibleImages.includes(selectedUrl) ? selectedUrl : visibleImages[0] ?? "";

  const handleImageError = (url: string) => {
    setFailedUrls((current) => (current.includes(url) ? current : [...current, url]));
    const nextUrl = visibleImages.find((candidate) => candidate !== url) ?? "";
    setSelectedUrl(nextUrl);
  };

  return (
    <V2Card>
      <Stack spacing={2}>
        <Box>
          <Typography component="h2" variant="h6">Media gallery</Typography>
          <Typography variant="body2" color="text.secondary">
            Reachable raw product images from the admin data source.
          </Typography>
        </Box>

        <Box
          sx={{
            width: "100%",
            aspectRatio: "1 / 1",
            position: "relative",
            overflow: "hidden",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "action.hover",
            display: "grid",
            placeItems: "center",
          }}
        >
          {activeUrl ? (
            <Image
              src={activeUrl}
              alt={`${product.name} admin preview`}
              fill
              sizes="(max-width: 900px) 100vw, 42vw"
              style={{ objectFit: "contain" }}
              onError={() => handleImageError(activeUrl)}
            />
          ) : (
            <Stack spacing={1} sx={{ alignItems: "center", color: "text.secondary" }}>
              <ImageOff size={34} aria-hidden="true" />
              <Typography variant="body2">No usable product image</Typography>
            </Stack>
          )}
        </Box>

        {visibleImages.length > 1 ? (
          <Grid container spacing={1.25} aria-label="Product gallery thumbnails">
            {visibleImages.map((url, index) => (
              <Grid key={url} size={{ xs: 3 }}>
                <ButtonBase
                  aria-label={`View product image ${index + 1}`}
                  aria-pressed={activeUrl === url}
                  onClick={() => setSelectedUrl(url)}
                  sx={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 2,
                    border: "2px solid",
                    borderColor: activeUrl === url ? "primary.main" : "divider",
                    bgcolor: "action.hover",
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: "primary.main",
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="100px"
                    style={{ objectFit: "cover" }}
                    onError={() => handleImageError(url)}
                  />
                </ButtonBase>
              </Grid>
            ))}
          </Grid>
        ) : null}

        <Typography variant="caption" color="text.secondary">
          {visibleImages.length} reachable image{visibleImages.length === 1 ? "" : "s"}. Media remains read-only.
        </Typography>
      </Stack>
    </V2Card>
  );
}

function OptionGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <Box>
      <Typography variant="subtitle2">{label}</Typography>
      {values.length > 0 ? (
        <Stack direction="row" sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
          {values.map((value) => <Chip key={value} label={value} size="small" variant="outlined" />)}
        </Stack>
      ) : (
        <EmptyValue>Not provided</EmptyValue>
      )}
    </Box>
  );
}

function StoredText({ value }: { value: string }) {
  return value ? (
    <Typography variant="body2" sx={{ whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
      {value}
    </Typography>
  ) : (
    <EmptyValue>Not provided</EmptyValue>
  );
}

function BooleanField({ label, value }: { label: string; value: boolean }) {
  return <Field label={label}>{value ? "Yes" : "No"}</Field>;
}

export function AdminV2ProductDetailView({ data }: { data: AdminV2ProductDetailData }) {
  const product = data.product;

  if (!data.available || !product) {
    return (
      <>
        <V2PageHeader
          title="Product unavailable"
          description="The real product data source could not be used."
          breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Products", href: "/admin-v2/products" }, { label: "Unavailable" }]}
          actions={<V2Button href="/admin-v2/products" startIcon={<ArrowLeft size={16} />}>Back to products</V2Button>}
        />
        <Alert severity="warning">
          Product detail is unavailable because the storage mode is {data.storageMode}. Static and demo fallback data is intentionally hidden.
        </Alert>
      </>
    );
  }

  const comparisonPrice = product.compareAtPrice !== null && product.compareAtPrice > product.price;

  return (
    <>
      <V2PageHeader
        title={product.name}
        description={`Read-only product record · ID: ${product.id}`}
        breadcrumbs={[
          { label: "Admin V2", href: "/admin-v2/dashboard" },
          { label: "Products", href: "/admin-v2/products" },
          { label: product.name },
        ]}
        actions={
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            <Chip
              label={product.status === "active" ? "Active" : "Draft"}
              color={product.status === "active" ? "success" : "default"}
              variant={product.status === "active" ? "filled" : "outlined"}
            />
            <Chip label="Read-only phase" color="primary" variant="outlined" />
            <V2Button href="/admin-v2/products" startIcon={<ArrowLeft size={16} />}>
              Back to products
            </V2Button>
          </Stack>
        }
      />

      <Stack spacing={3}>
        {product.warnings.length > 0 ? (
          <V2Card>
            <Stack spacing={1.5}>
              <Box>
                <Typography component="h2" variant="h6">Operational warnings</Typography>
                <Typography variant="body2" color="text.secondary">
                  These checks are informational and do not change the stored product.
                </Typography>
              </Box>
              {product.warnings.map((warning) => (
                <Alert key={warning.title} severity={warning.severity}>
                  <strong>{warning.title}.</strong> {warning.message}
                </Alert>
              ))}
              {product.unavailableImageReferences.length > 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                  Unavailable: {product.unavailableImageReferences.join(", ")}
                </Typography>
              ) : null}
            </Stack>
          </V2Card>
        ) : null}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 5 }}>
            <ProductMediaGallery product={product} />
          </Grid>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Stack spacing={3}>
              <V2Card>
                <Stack spacing={2.25}>
                  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                    <Box>
                      <Typography component="h2" variant="h6">Product summary</Typography>
                      <Typography variant="body2" color="text.secondary">Stored catalog identity and availability.</Typography>
                    </Box>
                    <Package size={22} aria-hidden="true" />
                  </Stack>
                  <Divider />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}><Field label="Product ID">{product.id}</Field></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Field label="Slug">{product.slug || "Not provided"}</Field></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Field label="Category">{product.category || "Uncategorized"}</Field></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Field label="Status">{product.status === "active" ? "Active" : "Draft"}</Field></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Field label="Created">{formatDate(product.createdAt)}</Field></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Field label="Updated">{formatDate(product.updatedAt)}</Field></Grid>
                  </Grid>
                  {product.publicPath ? (
                    <MuiLink
                      component={Link}
                      href={product.publicPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, width: "fit-content" }}
                    >
                      View active public product <ExternalLink size={15} aria-hidden="true" />
                    </MuiLink>
                  ) : (
                    <Alert severity="info">No public link is offered while this product is a draft.</Alert>
                  )}
                </Stack>
              </V2Card>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <V2Card sx={{ height: "100%" }}>
                    <Stack spacing={1.5}>
                      <Typography component="h2" variant="h6">Pricing</Typography>
                      <Typography variant="h5">{formatPrice(product.price, product.currency)}</Typography>
                      {comparisonPrice ? (
                        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                          Compare at {formatPrice(product.compareAtPrice as number, product.currency)}
                        </Typography>
                      ) : (
                        <EmptyValue>No higher compare-at price</EmptyValue>
                      )}
                    </Stack>
                  </V2Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <V2Card sx={{ height: "100%" }}>
                    <Stack spacing={1.5}>
                      <Typography component="h2" variant="h6">Stock</Typography>
                      <Chip
                        label={stockLabels[product.stockStatus]}
                        color={stockColors[product.stockStatus]}
                        variant="outlined"
                        sx={{ width: "fit-content" }}
                      />
                      <Field label="Quantity">{product.stockQuantity === null ? "Not provided" : `${product.stockQuantity} units`}</Field>
                      <Field label="Low-stock threshold">{product.lowStockThreshold === null ? "Not provided" : product.lowStockThreshold}</Field>
                    </Stack>
                  </V2Card>
                </Grid>
              </Grid>
            </Stack>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <V2Card sx={{ height: "100%" }}>
              <Stack spacing={2.5}>
                <Typography component="h2" variant="h6">Options and variants</Typography>
                <OptionGroup label="Sizes" values={product.sizes} />
                <OptionGroup label="Colors" values={product.colors} />
                <OptionGroup
                  label="Absorbency options"
                  values={product.absorbencyOptions.length > 0 ? product.absorbencyOptions : product.absorbency ? [product.absorbency] : []}
                />
              </Stack>
            </V2Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <V2Card sx={{ height: "100%" }}>
              <Stack spacing={2}>
                <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                  <SearchCheck size={20} aria-hidden="true" />
                  <Typography component="h2" variant="h6">Merchandising state</Typography>
                </Stack>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}><BooleanField label="Featured" value={product.featured} /></Grid>
                  <Grid size={{ xs: 6 }}><BooleanField label="Trending" value={product.isTrending} /></Grid>
                  <Grid size={{ xs: 6 }}><BooleanField label="Best seller" value={product.isBestSeller} /></Grid>
                  <Grid size={{ xs: 6 }}><BooleanField label="New arrival" value={product.isNewArrival} /></Grid>
                  <Grid size={{ xs: 6 }}><BooleanField label="Homepage" value={product.showOnHomepage} /></Grid>
                  <Grid size={{ xs: 6 }}><BooleanField label="Featured collection" value={product.showInFeaturedCollection} /></Grid>
                </Grid>
              </Stack>
            </V2Card>
          </Grid>
        </Grid>

        <V2Card>
          <Stack spacing={3}>
            <Typography component="h2" variant="h6">Product content</Typography>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.75 }}>Short description</Typography>
              <StoredText value={product.shortDescription} />
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.75 }}>Description</Typography>
              <StoredText value={product.description} />
            </Box>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}><OptionGroup label="Stored benefits" values={product.benefits} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><OptionGroup label="Stored care guidance" values={product.care} /></Grid>
            </Grid>
          </Stack>
        </V2Card>

        <V2Card>
          <Stack spacing={2.5}>
            <Box>
              <Typography component="h2" variant="h6">SEO preview data</Typography>
              <Typography variant="body2" color="text.secondary">Stored metadata only; this view does not publish changes.</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.75 }}>SEO title</Typography>
              <StoredText value={product.seoTitle} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.75 }}>SEO description</Typography>
              <StoredText value={product.seoDescription} />
            </Box>
          </Stack>
        </V2Card>

        <Alert severity="info">
          Editing, publishing, archiving, inventory changes, pricing changes, and media uploads remain unavailable in this read-only phase.
        </Alert>
      </Stack>
    </>
  );
}
