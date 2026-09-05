"use client";

import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  Divider,
  Grid,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { ArrowLeft, ExternalLink, ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type {
  AdminV2ProductDetail,
  AdminV2ProductDetailData,
} from "@/lib/admin-v2/products";
import { V2Tabs } from "@/components/admin-v2/forms/V2Tabs";
import { V2Breadcrumbs } from "@/components/admin-v2/shared/V2Breadcrumbs";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";

type DetailTab = "overview" | "content" | "seo" | "merchandising" | "warnings";

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

function Field({ label, children, mono = false }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        component="div"
        variant="body2"
        sx={{
          mt: 0.15,
          fontWeight: 600,
          fontFamily: mono ? "var(--font-geist-mono), monospace" : undefined,
          fontSize: mono ? "0.75rem" : undefined,
          overflowWrap: "anywhere",
          userSelect: mono ? "all" : undefined,
        }}
      >
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
    setSelectedUrl(visibleImages.find((candidate) => candidate !== url) ?? "");
  };

  return (
    <V2Card sx={{ height: "100%" }}>
      <Stack spacing={1.5}>
        <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
          <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
            Product media
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {visibleImages.length} image{visibleImages.length === 1 ? "" : "s"}
          </Typography>
        </Stack>

        <Box
          sx={{
            width: "100%",
            height: { xs: 260, sm: 340, lg: 400 },
            maxHeight: 420,
            position: "relative",
            overflow: "hidden",
            borderRadius: 2.5,
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
              sizes="(max-width: 900px) 100vw, 40vw"
              style={{ objectFit: "contain" }}
              onError={() => handleImageError(activeUrl)}
            />
          ) : (
            <Stack spacing={0.75} sx={{ alignItems: "center", color: "text.secondary" }}>
              <ImageOff size={30} aria-hidden="true" />
              <Typography variant="body2">No usable product image</Typography>
            </Stack>
          )}
        </Box>

        {visibleImages.length > 1 ? (
          <Stack
            direction="row"
            spacing={1}
            aria-label="Product gallery thumbnails"
            sx={{ overflowX: "auto", pb: 0.5, scrollbarWidth: "thin" }}
          >
            {visibleImages.map((url, index) => (
              <ButtonBase
                key={url}
                aria-label={`View product image ${index + 1}`}
                aria-pressed={activeUrl === url}
                onClick={() => setSelectedUrl(url)}
                sx={{
                  width: 58,
                  height: 58,
                  flex: "0 0 58px",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 1.75,
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
                  sizes="58px"
                  style={{ objectFit: "cover" }}
                  onError={() => handleImageError(url)}
                />
              </ButtonBase>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </V2Card>
  );
}

function OptionGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <Box>
      <Typography variant="subtitle2">{label}</Typography>
      {values.length > 0 ? (
        <Stack direction="row" sx={{ mt: 0.75, flexWrap: "wrap", gap: 0.75 }}>
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
    <Typography variant="body2" sx={{ whiteSpace: "pre-line", overflowWrap: "anywhere", lineHeight: 1.65 }}>
      {value}
    </Typography>
  ) : (
    <EmptyValue>Not provided</EmptyValue>
  );
}

function BooleanField({ label, value }: { label: string; value: boolean }) {
  return <Field label={label}>{value ? "Yes" : "No"}</Field>;
}

function CompactHeader({ product, canEditDraft, canManageMedia, canPublish, canUnpublish }: { product: AdminV2ProductDetail; canEditDraft: boolean; canManageMedia: boolean; canPublish: boolean; canUnpublish: boolean }) {
  return (
    <Box sx={{ mb: 2 }}>
      <V2Breadcrumbs
        items={[
          { label: "Admin V2", href: "/admin-v2/dashboard" },
          { label: "Products", href: "/admin-v2/products" },
          { label: product.name },
        ]}
      />
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ alignItems: { md: "flex-start" }, justifyContent: "space-between" }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 750, overflowWrap: "anywhere" }}>
            {product.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.35 }}>
            Product record · ID {product.id}
          </Typography>
        </Box>
        <Stack direction="row" sx={{ flexWrap: "wrap", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
          <Chip
            size="small"
            label={product.status === "active" ? "Active" : "Draft"}
            color={product.status === "active" ? "success" : "default"}
            variant={product.status === "active" ? "filled" : "outlined"}
          />
          <Chip size="small" label="Read-only" color="primary" variant="outlined" />
          {canEditDraft && product.status === "draft" ? (
            <V2Button size="small" variant="contained" href={`/admin-v2/products/${encodeURIComponent(product.id)}/edit`}>
              Edit draft
            </V2Button>
          ) : null}
          {canManageMedia && product.status === "draft" ? (
            <V2Button size="small" href={`/admin-v2/products/${encodeURIComponent(product.id)}/media`}>
              Manage media
            </V2Button>
          ) : null}
          {canPublish && product.status === "draft" ? (
            <V2Button size="small" color="warning" variant="contained" href={`/admin-v2/products/${encodeURIComponent(product.id)}/publish`}>
              Publish product
            </V2Button>
          ) : null}
          {canUnpublish && product.status === "active" ? (
            <V2Button size="small" color="warning" variant="outlined" href={`/admin-v2/products/${encodeURIComponent(product.id)}/unpublish`}>
              Unpublish product
            </V2Button>
          ) : null}
          <V2Button size="small" href="/admin-v2/products" startIcon={<ArrowLeft size={15} />}>
            Back to products
          </V2Button>
        </Stack>
      </Stack>
    </Box>
  );
}

function ProductSummary({ product }: { product: AdminV2ProductDetail }) {
  const comparisonPrice = product.compareAtPrice !== null && product.compareAtPrice > product.price;

  return (
    <Stack spacing={2} sx={{ height: "100%" }}>
      <V2Card>
        <Stack spacing={1.5}>
          <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
            Product summary
          </Typography>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}><Field label="Product ID" mono>{product.id}</Field></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><Field label="Slug" mono>{product.slug || "Not provided"}</Field></Grid>
            <Grid size={{ xs: 6 }}><Field label="Category">{product.category || "Uncategorized"}</Field></Grid>
            <Grid size={{ xs: 6 }}><Field label="Status">{product.status === "active" ? "Active" : "Draft"}</Field></Grid>
            <Grid size={{ xs: 6 }}><Field label="Created">{formatDate(product.createdAt)}</Field></Grid>
            <Grid size={{ xs: 6 }}><Field label="Updated">{formatDate(product.updatedAt)}</Field></Grid>
          </Grid>
          {product.publicPath ? (
            <MuiLink
              component={Link}
              href={product.publicPath}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, width: "fit-content", fontSize: "0.875rem" }}
            >
              View public product <ExternalLink size={14} aria-hidden="true" />
            </MuiLink>
          ) : (
            <Typography variant="caption" color="warning.main">Draft — no public product link</Typography>
          )}
        </Stack>
      </V2Card>

      <Grid container spacing={2} sx={{ flex: 1 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <V2Card sx={{ height: "100%" }}>
            <Stack spacing={0.75}>
              <Typography variant="caption" color="text.secondary">Selling price</Typography>
              <Typography variant="h5" sx={{ fontWeight: 750 }}>
                {formatPrice(product.price, product.currency)}
              </Typography>
              {comparisonPrice ? (
                <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                  Compare at {formatPrice(product.compareAtPrice as number, product.currency)}
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">No higher compare-at price</Typography>
              )}
            </Stack>
          </V2Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <V2Card sx={{ height: "100%" }}>
            <Stack spacing={0.75}>
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                <Typography variant="caption" color="text.secondary">Stock</Typography>
                <Chip
                  size="small"
                  label={stockLabels[product.stockStatus]}
                  color={stockColors[product.stockStatus]}
                  variant="outlined"
                />
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 750 }}>
                {product.stockQuantity === null ? "Not provided" : `${product.stockQuantity} units`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Low-stock threshold: {product.lowStockThreshold === null ? "Not provided" : product.lowStockThreshold}
              </Typography>
            </Stack>
          </V2Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

function OverviewPanel({ product }: { product: AdminV2ProductDetail }) {
  const absorbency = product.absorbencyOptions.length > 0
    ? product.absorbencyOptions
    : product.absorbency
      ? [product.absorbency]
      : [];

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4 }}><OptionGroup label="Sizes" values={product.sizes} /></Grid>
      <Grid size={{ xs: 12, md: 4 }}><OptionGroup label="Colors" values={product.colors} /></Grid>
      <Grid size={{ xs: 12, md: 4 }}><OptionGroup label="Absorbency" values={absorbency} /></Grid>
    </Grid>
  );
}

function ContentPanel({ product }: { product: AdminV2ProductDetail }) {
  return (
    <Stack spacing={2.25}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Short description</Typography>
        <StoredText value={product.shortDescription} />
      </Box>
      <Divider />
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Description</Typography>
        <StoredText value={product.description} />
      </Box>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}><OptionGroup label="Stored benefits" values={product.benefits} /></Grid>
        <Grid size={{ xs: 12, md: 6 }}><OptionGroup label="Stored care guidance" values={product.care} /></Grid>
      </Grid>
    </Stack>
  );
}

function SeoPanel({ product }: { product: AdminV2ProductDetail }) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>SEO title</Typography>
        <StoredText value={product.seoTitle} />
      </Grid>
      <Grid size={{ xs: 12, md: 7 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>SEO description</Typography>
        <StoredText value={product.seoDescription} />
      </Grid>
    </Grid>
  );
}

function MerchandisingPanel({ product }: { product: AdminV2ProductDetail }) {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 6, md: 2 }}><BooleanField label="Featured" value={product.featured} /></Grid>
      <Grid size={{ xs: 6, md: 2 }}><BooleanField label="Trending" value={product.isTrending} /></Grid>
      <Grid size={{ xs: 6, md: 2 }}><BooleanField label="Best seller" value={product.isBestSeller} /></Grid>
      <Grid size={{ xs: 6, md: 2 }}><BooleanField label="New arrival" value={product.isNewArrival} /></Grid>
      <Grid size={{ xs: 6, md: 2 }}><BooleanField label="Homepage" value={product.showOnHomepage} /></Grid>
      <Grid size={{ xs: 6, md: 2 }}><BooleanField label="Featured collection" value={product.showInFeaturedCollection} /></Grid>
    </Grid>
  );
}

function WarningsPanel({ product }: { product: AdminV2ProductDetail }) {
  if (product.warnings.length === 0) {
    return <Alert severity="success">No automatic catalog warnings were detected for this product.</Alert>;
  }

  return (
    <Stack spacing={1.25}>
      {product.warnings.map((warning) => (
        <Alert key={warning.title} severity={warning.severity} sx={{ py: 0.25 }}>
          <strong>{warning.title}.</strong> {warning.message}
        </Alert>
      ))}
      {product.unavailableImageReferences.length > 0 ? (
        <Box
          component="details"
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            px: 1.5,
            py: 1,
            "& > summary": { cursor: "pointer", fontSize: "0.8125rem", fontWeight: 650 },
          }}
        >
          <summary>Show {product.unavailableImageReferences.length} unavailable filename{product.unavailableImageReferences.length === 1 ? "" : "s"}</summary>
          <Typography
            component="p"
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, mb: 0, overflowWrap: "anywhere", lineHeight: 1.6 }}
          >
            {product.unavailableImageReferences.join(", ")}
          </Typography>
        </Box>
      ) : null}
    </Stack>
  );
}

export function AdminV2ProductDetailView({ data, canEditDraft = false, canManageMedia = false, canPublish = false, canUnpublish = false }: { data: AdminV2ProductDetailData; canEditDraft?: boolean; canManageMedia?: boolean; canPublish?: boolean; canUnpublish?: boolean }) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
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

  const warningCount = product.warnings.length;
  const tabs: Array<{ label: string; value: DetailTab }> = [
    { label: "Overview", value: "overview" },
    { label: "Content", value: "content" },
    { label: "SEO", value: "seo" },
    { label: "Merchandising", value: "merchandising" },
    { label: warningCount > 0 ? `Warnings (${warningCount})` : "Warnings", value: "warnings" },
  ];

  return (
    <>
      <CompactHeader product={product} canEditDraft={canEditDraft} canManageMedia={canManageMedia} canPublish={canPublish} canUnpublish={canUnpublish} />

      <Stack spacing={2.25}>
        {warningCount > 0 ? (
          <Alert
            severity="warning"
            sx={{ py: 0.25, alignItems: "center" }}
            action={
              <Button color="inherit" size="small" onClick={() => setActiveTab("warnings")}>
                Review
              </Button>
            }
          >
            {warningCount} catalog check{warningCount === 1 ? "" : "s"} need attention: {product.warnings.map((warning) => warning.title).join(", ")}.
          </Alert>
        ) : null}

        <Grid container spacing={2.25} sx={{ alignItems: "stretch" }}>
          <Grid size={{ xs: 12, lg: 5 }}>
            <ProductMediaGallery product={product} />
          </Grid>
          <Grid size={{ xs: 12, lg: 7 }}>
            <ProductSummary product={product} />
          </Grid>
        </Grid>

        <V2Card>
          <Box sx={{ mx: { xs: -1, md: -1.5 }, mt: { xs: -1, md: -1.5 } }}>
            <V2Tabs
              value={activeTab}
              onChange={(value) => setActiveTab(value as DetailTab)}
              items={tabs}
            />
          </Box>
          <Divider sx={{ mt: 0.5, mb: 2.25 }} />
          <Box role="tabpanel" aria-label={`${tabs.find((tab) => tab.value === activeTab)?.label} product details`}>
            {activeTab === "overview" ? <OverviewPanel product={product} /> : null}
            {activeTab === "content" ? <ContentPanel product={product} /> : null}
            {activeTab === "seo" ? <SeoPanel product={product} /> : null}
            {activeTab === "merchandising" ? <MerchandisingPanel product={product} /> : null}
            {activeTab === "warnings" ? <WarningsPanel product={product} /> : null}
          </Box>
        </V2Card>

        <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", pb: 0.5 }}>
          {canEditDraft && product.status === "draft"
            ? "This record is read-only. Use Edit draft to update its private draft details. Publishing and media management remain unavailable."
            : "Editing, publishing, inventory changes, pricing changes, and media management remain unavailable."}
        </Typography>
      </Stack>
    </>
  );
}
