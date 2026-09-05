"use client";

import {
  Alert,
  Box,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CheckCircle2,
  Clipboard,
  ExternalLink,
  FilePenLine,
  Package,
  PackageX,
  Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProductStockStatus } from "@/app/lib/product-types";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2MetricCard } from "@/components/admin-v2/shared/V2MetricCard";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { V2Select } from "@/components/admin-v2/forms/V2Select";
import type {
  AdminV2ProductCatalogData,
  AdminV2ProductListItem,
} from "@/lib/admin-v2/products";

type ProductStatusFilter = "all" | "active" | "draft";
type StockStatusFilter = "all" | ProductStockStatus;

const stockLabels: Record<ProductStockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
  preorder: "Preorder",
};

const stockColors: Record<ProductStockStatus, "success" | "warning" | "error" | "info"> = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "error",
  preorder: "info",
};

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

function formatUpdatedAt(value: string | null) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

function ProductThumbnail({ product }: { product: AdminV2ProductListItem }) {
  const [imageIndex, setImageIndex] = useState(0);
  const imageUrl = product.imageUrls[imageIndex];

  return (
    <Box
      sx={{
        width: 58,
        height: 58,
        flex: "0 0 auto",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "action.hover",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        position: "relative",
      }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${product.name} thumbnail`}
          fill
          sizes="58px"
          style={{ objectFit: "cover" }}
          onError={() => setImageIndex((current) => current + 1)}
        />
      ) : (
        <Package size={22} aria-hidden="true" />
      )}
    </Box>
  );
}

function ProductIdentity({ product }: { product: AdminV2ProductListItem }) {
  const [toastOpen, setToastOpen] = useState(false);

  const copySlug = async () => {
    try {
      await navigator.clipboard.writeText(product.slug);
      setToastOpen(true);
    } catch {
      // Clipboard availability varies by browser and security context; the slug remains selectable.
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
        <ProductThumbnail product={product} />
        <Box sx={{ minWidth: 0 }}>
          <MuiLink
            component={Link}
            href={`/admin-v2/products/${encodeURIComponent(product.id)}`}
            aria-label={`View admin details for ${product.name}`}
            underline="hover"
            sx={{ display: "inline-block", fontWeight: 700, overflowWrap: "anywhere" }}
          >
            {product.name}
          </MuiLink>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", minWidth: 0 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {product.slug}
            </Typography>
            <Tooltip title="Copy slug">
              <IconButton
                size="small"
                aria-label={`Copy slug for ${product.name}`}
                onClick={() => void copySlug()}
              >
                <Clipboard size={14} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Stack>
      <Snackbar
        open={toastOpen}
        autoHideDuration={2400}
        onClose={() => setToastOpen(false)}
        message="Product slug copied."
      />
    </>
  );
}

function ProductStatus({ product }: { product: AdminV2ProductListItem }) {
  return (
    <Chip
      size="small"
      label={product.status === "active" ? "Active" : "Draft"}
      color={product.status === "active" ? "success" : "default"}
      variant={product.status === "active" ? "filled" : "outlined"}
    />
  );
}

function ProductStock({ product }: { product: AdminV2ProductListItem }) {
  return (
    <Stack spacing={0.5} sx={{ alignItems: "flex-start" }}>
      <Chip
        size="small"
        label={stockLabels[product.stockStatus]}
        color={stockColors[product.stockStatus]}
        variant="outlined"
      />
      <Typography variant="caption" color="text.secondary">
        {product.stockQuantity === null ? "Quantity not provided" : `${product.stockQuantity} units`}
      </Typography>
    </Stack>
  );
}

function ProductPrice({ product }: { product: AdminV2ProductListItem }) {
  const hasComparison =
    product.compareAtPrice !== null && product.compareAtPrice > product.price;

  return (
    <Stack spacing={0.25}>
      <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
        {formatPrice(product.price, product.currency)}
      </Typography>
      {hasComparison ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textDecoration: "line-through", whiteSpace: "nowrap" }}
        >
          {formatPrice(product.compareAtPrice as number, product.currency)}
        </Typography>
      ) : null}
    </Stack>
  );
}

function PublicProductLink({ product }: { product: AdminV2ProductListItem }) {
  if (!product.slug || product.status !== "active") {
    return <Typography variant="caption" color="text.secondary">Draft — no public link</Typography>;
  }

  return (
    <MuiLink
      component={Link}
      href={`/product/${encodeURIComponent(product.slug)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open public page for ${product.name}`}
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, whiteSpace: "nowrap" }}
    >
      View public <ExternalLink size={14} aria-hidden="true" />
    </MuiLink>
  );
}

function ProductsDesktopTable({ products }: { products: AdminV2ProductListItem[] }) {
  return (
    <V2Card sx={{ display: { xs: "none", lg: "block" } }}>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" aria-label="Real Noromi Care products">
          <TableHead>
            <TableRow>
              {[
                "Product",
                "Status",
                "Price",
                "Stock",
                "Category and options",
                "Updated",
                "Public page",
              ].map((heading) => (
                <TableCell key={heading} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                  {heading}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} hover>
                <TableCell sx={{ minWidth: 290 }}>
                  <ProductIdentity product={product} />
                </TableCell>
                <TableCell><ProductStatus product={product} /></TableCell>
                <TableCell><ProductPrice product={product} /></TableCell>
                <TableCell sx={{ minWidth: 130 }}><ProductStock product={product} /></TableCell>
                <TableCell sx={{ minWidth: 230 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{product.category || "Uncategorized"}</Typography>
                  <Typography variant="caption" color="text.secondary">{product.optionSummary}</Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{formatUpdatedAt(product.updatedAt)}</TableCell>
                <TableCell><PublicProductLink product={product} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </V2Card>
  );
}

function ProductsMobileCards({ products }: { products: AdminV2ProductListItem[] }) {
  return (
    <Stack spacing={2} sx={{ display: { xs: "flex", lg: "none" } }}>
      {products.map((product) => (
        <V2Card key={product.id}>
          <Stack spacing={2}>
            <ProductIdentity product={product} />
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
              <ProductStatus product={product} />
              <Chip
                size="small"
                label={stockLabels[product.stockStatus]}
                color={stockColors[product.stockStatus]}
                variant="outlined"
              />
            </Stack>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Price</Typography>
                <ProductPrice product={product} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Stock quantity</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {product.stockQuantity === null ? "Not provided" : product.stockQuantity}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Category</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{product.category || "Uncategorized"}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Updated</Typography>
                <Typography variant="body2">{formatUpdatedAt(product.updatedAt)}</Typography>
              </Grid>
            </Grid>
            <Box>
              <Typography variant="caption" color="text.secondary">Options</Typography>
              <Typography variant="body2">{product.optionSummary}</Typography>
            </Box>
            <PublicProductLink product={product} />
          </Stack>
        </V2Card>
      ))}
    </Stack>
  );
}

export function AdminV2ProductsView({ data }: { data: AdminV2ProductCatalogData }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProductStatusFilter>("all");
  const [stockStatus, setStockStatus] = useState<StockStatusFilter>("all");

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return data.products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLocaleLowerCase().includes(normalizedQuery) ||
        product.slug.toLocaleLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "all" || product.status === status;
      const matchesStock = stockStatus === "all" || product.stockStatus === stockStatus;
      return matchesQuery && matchesStatus && matchesStock;
    });
  }, [data.products, query, status, stockStatus]);

  const isFiltered = Boolean(query.trim()) || status !== "all" || stockStatus !== "all";
  const summaryCards = [
    { label: "Total products", value: data.summary.total, icon: Package, tone: "primary" as const },
    { label: "Active", value: data.summary.active, icon: CheckCircle2, tone: "success" as const },
    { label: "Draft", value: data.summary.draft, icon: FilePenLine, tone: "info" as const },
    { label: "Low / out of stock", value: data.summary.lowOrOutOfStock, icon: PackageX, tone: "warning" as const },
  ];

  return (
    <>
      <V2PageHeader
        title="Products"
        description="Review the real product catalog, public status, pricing, options, and stock at a glance."
        breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Products" }]}
        actions={<Chip label="Draft workflow phase" color="primary" variant="outlined" />}
      />

      <Stack spacing={3}>
        {!data.available ? (
          <Alert severity="warning">
            Real products are unavailable because the product source is {data.storageMode}. Static and demo
            fallback products are intentionally hidden from Admin V2.
          </Alert>
        ) : (
          <Alert severity="info">
            This catalog supports draft-only creation, editing, media uploads, and publishing through review.
            Active products remain read-only. Inventory updates are not available yet.
          </Alert>
        )}

        <Grid container spacing={3}>
          {summaryCards.map((card) => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, xl: 3 }}>
              <V2MetricCard
                label={card.label}
                value={String(card.value)}
                animatedValue={card.value}
                icon={card.icon}
                tone={card.tone}
              />
            </Grid>
          ))}
        </Grid>

        {data.available ? (
          <V2Card>
            <Grid container spacing={2} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search products"
                  placeholder="Search by name or slug"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start"><Search size={17} /></InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <V2Select
                  label="Status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ProductStatusFilter)}
                  options={[
                    { label: "All statuses", value: "all" },
                    { label: "Active", value: "active" },
                    { label: "Draft", value: "draft" },
                  ]}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <V2Select
                  label="Stock"
                  value={stockStatus}
                  onChange={(event) => setStockStatus(event.target.value as StockStatusFilter)}
                  options={[
                    { label: "All stock states", value: "all" },
                    { label: "In stock", value: "in_stock" },
                    { label: "Low stock", value: "low_stock" },
                    { label: "Out of stock", value: "out_of_stock" },
                    { label: "Preorder", value: "preorder" },
                  ]}
                />
              </Grid>
            </Grid>
          </V2Card>
        ) : null}

        {data.available && filteredProducts.length > 0 ? (
          <>
            <Typography variant="body2" color="text.secondary" aria-live="polite">
              Showing {filteredProducts.length} of {data.products.length} real products.
            </Typography>
            <ProductsDesktopTable products={filteredProducts} />
            <ProductsMobileCards products={filteredProducts} />
          </>
        ) : null}

        {data.available && filteredProducts.length === 0 ? (
          <V2Card>
            <Stack spacing={1} sx={{ alignItems: "center", py: 4, textAlign: "center" }}>
              <PackageX size={34} aria-hidden="true" />
              <Typography component="h2" variant="h6">
                {isFiltered ? "No products match these filters" : "No products are available"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isFiltered
                  ? "Adjust the search or filters to view another part of the catalog."
                  : "The real product source returned no non-deleted catalog records."}
              </Typography>
            </Stack>
          </V2Card>
        ) : null}
      </Stack>
    </>
  );
}
