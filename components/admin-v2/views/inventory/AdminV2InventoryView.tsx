"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Typography,
} from "@mui/material";
import { Boxes, Package, PackageCheck, PackageX } from "lucide-react";
import type { ProductStockStatus } from "@/app/lib/product-types";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { V2MetricCard } from "@/components/admin-v2/shared/V2MetricCard";
import type { AdminV2ProductCatalogData, AdminV2ProductListItem } from "@/lib/admin-v2/products";

const states: { value: ProductStockStatus; label: string }[] = [
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "preorder", label: "Pre-order" },
  { value: "out_of_stock", label: "Out of stock" },
];

function validStock(status: ProductStockStatus, quantity: number) {
  return Number.isSafeInteger(quantity) && quantity >= 0 && quantity <= 1000000 &&
    (status === "in_stock" || status === "low_stock" ? quantity > 0 : status === "out_of_stock" ? quantity === 0 : true);
}

export function AdminV2InventoryView({ data, canEdit }: { data: AdminV2ProductCatalogData; canEdit: boolean }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminV2ProductListItem | null>(null);
  const [quantity, setQuantity] = useState("0");
  const [status, setStatus] = useState<ProductStockStatus>("out_of_stock");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ severity: "success" | "error"; text: string } | null>(null);

  const items = useMemo(() => data.products.filter((product) =>
    !search.trim() || [product.name, product.slug, product.category].some((part) =>
      part.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
    )
  ), [data.products, search]);
  const available = data.available;
  const active = data.products.filter((p) => p.status === "active");
  const preorders = active.filter((p) => p.stockStatus === "preorder").length;
  const sellable = active.filter((p) =>
    (p.stockStatus === "in_stock" || p.stockStatus === "low_stock") && (p.stockQuantity ?? 0) > 0
  ).length;

  function openEdit(product: AdminV2ProductListItem) {
    if (!canEdit) return;
    setMessage(null);
    setSelected(product);
    setStatus(product.stockStatus);
    setQuantity(String(product.stockQuantity ?? 0));
  }

  async function save() {
    if (!selected || saving) return;
    const count = Number(quantity);
    if (!validStock(status, count)) {
      setMessage({ severity: "error", text: "Enter a valid quantity. In/low stock requires at least one unit; out of stock requires zero." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      // The stock-only endpoint revalidates permission, previous stock state and quantity.
      const response = await fetch(`/api/admin-v2/inventory/${encodeURIComponent(selected.id)}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ stockStatus: status, stockQuantity: count,
          previousStockStatus: selected.stockStatus, previousStockQuantity: selected.stockQuantity }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        const errors = Array.isArray(result.errors) ? result.errors.join(" ") : "Unable to update inventory.";
        throw new Error(errors);
      }
      setSelected(null);
      setMessage({ severity: "success", text: "Inventory updated. The product catalog is being refreshed." });
      router.refresh();
    } catch (error) {
      setMessage({ severity: "error", text: error instanceof Error ? error.message : "Unable to update inventory." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <V2PageHeader title="Inventory" description="Real catalog quantities, pre-orders and stock status. Only authorized editors can change inventory."
        breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Inventory" }]}
        actions={<Button component={Link} href="/admin-v2/products" variant="outlined">All products</Button>} />
      <Stack spacing={3}>
        {!available ? (
          <Alert severity="error">Live product inventory is unavailable ({data.storageMode}). No demo stock values are shown.</Alert>
        ) : null}
        {message ? <Alert severity={message.severity} onClose={() => setMessage(null)}>{message.text}</Alert> : null}
        <Grid container spacing={2}>
          {[
            { label: "Catalog products", value: data.products.length, icon: Boxes },
            { label: "Active products", value: active.length, icon: Package },
            { label: "Available stock", value: sellable, icon: PackageCheck },
            { label: "Active pre-orders", value: preorders, icon: PackageX },
          ].map((metric) => (
            <Grid key={metric.label} size={{ xs: 12, sm: 6, xl: 3 }}>
              <V2MetricCard label={metric.label} value={available ? String(metric.value) : "Unavailable"}
                animatedValue={available ? metric.value : undefined} icon={metric.icon} />
            </Grid>
          ))}
        </Grid>
        <V2Card>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
              <Box>
                <Typography variant="h6">Stock control</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pre-order means no immediate shipment is promised. Deleted products are excluded.
                </Typography>
              </Box>
              <TextField size="small" label="Search products" value={search} onChange={(event) => setSearch(event.target.value)}
                sx={{ minWidth: { md: 290 } }} />
            </Stack>
            {available ? (
              <TableContainer>
                <Table size="small" aria-label="Inventory products">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell><TableCell>Status</TableCell><TableCell>Stock</TableCell>
                      <TableCell align="right">Quantity</TableCell><TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((product) => (
                      <TableRow key={product.id} hover>
                        <TableCell sx={{ maxWidth: 330 }}>
                          <Typography variant="body2" fontWeight={700}>{product.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{product.slug}</Typography>
                        </TableCell>
                        <TableCell><Chip size="small" label={product.status === "active" ? "Active" : "Draft"}
                          color={product.status === "active" ? "success" : "default"} variant="outlined" /></TableCell>
                        <TableCell><Chip size="small" label={states.find((s) => s.value === product.stockStatus)?.label ?? product.stockStatus}
                          color={product.stockStatus === "out_of_stock" ? "error" : product.stockStatus === "preorder" ? "warning" : "success"} variant="outlined" /></TableCell>
                        <TableCell align="right">{product.stockQuantity === null ? "Unknown" : product.stockQuantity}</TableCell>
                        <TableCell align="right">
                          {canEdit ? <Button size="small" onClick={() => openEdit(product)}>Update</Button> :
                            <Typography variant="caption" color="text.secondary">View only</Typography>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 ? <TableRow><TableCell colSpan={5}>No matching products.</TableCell></TableRow> : null}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : null}
          </Stack>
        </V2Card>
      </Stack>
      <Dialog open={Boolean(selected)} onClose={() => { if (!saving) setSelected(null); }} fullWidth maxWidth="xs">
        <DialogTitle>Update stock</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">{selected?.name}</Typography>
            <TextField label="Stock status" size="small" select value={status} onChange={(event) => setStatus(event.target.value as ProductStockStatus)}>
              {states.map((state) => <MenuItem key={state.value} value={state.value}>{state.label}</MenuItem>)}
            </TextField>
            <TextField label="Stock quantity" size="small" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)}
              slotProps={{ htmlInput: { min: 0, max: 1000000, step: 1 } }} />
            <Alert severity="info">Only stock status and quantity are updated. Use actual counted stock; do not mark pre-orders in stock before stock arrives.</Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setSelected(null)}>Cancel</Button>
          <Button disabled={saving || !validStock(status, Number(quantity))} onClick={() => void save()} variant="contained">
            {saving ? "Saving…" : "Save stock"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
