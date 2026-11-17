"use client";

import { useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import type { AdminV2ProductCatalogData } from "@/lib/admin-v2/products";
import type { MediaLibraryStorageObject } from "@/lib/admin-v2/product-media-store";
import { mediaLibraryFilename } from "@/lib/admin-v2/media-library";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2Button } from "@/components/admin-v2/shared/V2Button";

type Notice = { severity: "error" | "success" | "info"; text: string } | null;
type LibraryItem = MediaLibraryStorageObject;
const linked = (catalog: AdminV2ProductCatalogData) => catalog.products.flatMap((product) => product.imageUrls.map((url) => ({ product, url })));
const bytes = (value: number | null) => value == null ? "Size unavailable" : `${(value / 1024 / 1024).toFixed(value < 1024 * 1024 ? 2 : 1)} MB`;
function errorText(payload: unknown) { return typeof payload === "object" && payload && Array.isArray((payload as { errors?: unknown }).errors) ? (payload as { errors: unknown[] }).errors.filter((value): value is string => typeof value === "string").join(" ") : "The media action could not be completed."; }

export function AdminV2MediaLibraryClient({ catalog, initialLibraryItems, canManage }: { catalog: AdminV2ProductCatalogData; initialLibraryItems: LibraryItem[]; canManage: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(initialLibraryItems); const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "library" | "attached">("all"); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<Notice>(null);
  const [renameItem, setRenameItem] = useState<LibraryItem | null>(null); const [rename, setRename] = useState("");
  const [associateItem, setAssociateItem] = useState<LibraryItem | null>(null); const [productId, setProductId] = useState("");
  const attached = useMemo(() => linked(catalog), [catalog]); const needle = query.trim().toLowerCase();
  const libraryCards = items.filter((item) => !needle || mediaLibraryFilename(item.path).toLowerCase().includes(needle));
  const attachedCards = attached.filter(({ product, url }) => !needle || `${product.name} ${url}`.toLowerCase().includes(needle));
  const productCount = new Set(attached.map((item) => item.url)).size;

  async function invoke(path: string, body: Record<string, unknown>) {
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(errorText(payload)); return payload;
  }
  async function upload(file: File | null) {
    if (!file) return; setBusy(true); setNotice(null);
    try { const form = new FormData(); form.set("file", file); const response = await fetch("/api/admin-v2/media/upload", { method: "POST", body: form }); const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.item) throw new Error(errorText(payload)); setItems((current) => [payload.item as LibraryItem, ...current]); setNotice({ severity: "success", text: "Image uploaded to the unassociated Media Library. Associate it with a product when ready." });
    } catch (error) { setNotice({ severity: "error", text: error instanceof Error ? error.message : "Upload failed." }); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  async function saveRename() {
    if (!renameItem) return; setBusy(true); setNotice(null);
    try { const payload = await invoke("/api/admin-v2/media/rename", { path: renameItem.path, filename: rename }) as { item: { path: string; publicUrl: string } };
      setItems((current) => current.map((item) => item.path === renameItem.path ? { ...item, path: payload.item.path, publicUrl: payload.item.publicUrl } : item)); setNotice({ severity: "success", text: "Library image renamed." }); setRenameItem(null);
    } catch (error) { setNotice({ severity: "error", text: error instanceof Error ? error.message : "Rename failed." }); } finally { setBusy(false); }
  }
  async function remove(item: LibraryItem) {
    if (!window.confirm(`Delete ${mediaLibraryFilename(item.path)}? This only deletes an unassociated library image.`)) return; setBusy(true); setNotice(null);
    try { await invoke("/api/admin-v2/media/delete", { path: item.path }); setItems((current) => current.filter((value) => value.path !== item.path)); setNotice({ severity: "success", text: "Unassociated library image deleted." });
    } catch (error) { setNotice({ severity: "error", text: error instanceof Error ? error.message : "Deletion failed." }); } finally { setBusy(false); }
  }
  async function associate() {
    if (!associateItem || !productId) return; setBusy(true); setNotice(null);
    try { await invoke("/api/admin-v2/media/associate", { path: associateItem.path, productId }); setItems((current) => current.filter((item) => item.path !== associateItem.path)); setNotice({ severity: "success", text: "Image attached to the selected product using its established media path." }); setAssociateItem(null); setProductId("");
    } catch (error) { setNotice({ severity: "error", text: error instanceof Error ? error.message : "Association failed." }); } finally { setBusy(false); }
  }

  const librarySection = <section><Typography variant="h6" sx={{ mb: 1 }}>Unassociated library</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Safe to rename, attach, or delete. Attached product media stays in its product editor.</Typography>
    <Grid container spacing={2}>{libraryCards.map((item) => <Grid key={item.path} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}><V2Card><Stack spacing={1.25}><Box component="img" src={item.publicUrl} alt={mediaLibraryFilename(item.path)} sx={{ height: 164, width: "100%", objectFit: "cover", borderRadius: 2, bgcolor: "action.hover" }} /><Typography variant="body2" sx={{ fontWeight: 700 }} noWrap title={mediaLibraryFilename(item.path)}>{mediaLibraryFilename(item.path)}</Typography><Typography variant="caption" color="text.secondary">{item.contentType ?? "Image"} · {bytes(item.sizeBytes)}</Typography>{canManage ? <Stack direction="row" spacing={1} flexWrap="wrap"><Button size="small" onClick={() => { setRenameItem(item); setRename(mediaLibraryFilename(item.path)); }}>Rename</Button><Button size="small" onClick={() => setAssociateItem(item)}>Attach to product</Button><Button size="small" color="error" onClick={() => void remove(item)} disabled={busy}>Delete</Button></Stack> : null}</Stack></V2Card></Grid>)}</Grid>{!libraryCards.length ? <Alert severity="info" sx={{ mt: 1.5 }}>No unassociated library images match this filter.</Alert> : null}</section>;
  const attachedSection = <section><Divider sx={{ my: 2.5 }} /><Typography variant="h6" sx={{ mb: 1 }}>Product-linked media</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Persisted catalog references. Use the Product Media Editor for gallery ordering, primary-image changes, or safe unlinking.</Typography>
    <Grid container spacing={2}>{attachedCards.map(({ product, url }, index) => <Grid key={`${product.id}-${index}`} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}><V2Card><Stack spacing={1.25}><Box component="img" src={url} alt={product.name} sx={{ height: 164, width: "100%", objectFit: "cover", borderRadius: 2, bgcolor: "action.hover" }} /><Typography variant="body2" sx={{ fontWeight: 700 }}>{product.name}</Typography><Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>{url}</Typography><V2Button size="small" variant="outlined" href={canManage ? `/admin-v2/products/${encodeURIComponent(product.id)}/media` : `/admin-v2/products/${encodeURIComponent(product.id)}`}>{canManage ? "Manage product media" : "View product"}</V2Button></Stack></V2Card></Grid>)}</Grid>{!attachedCards.length ? <Alert severity="info" sx={{ mt: 1.5 }}>No product-linked images match this filter.</Alert> : null}</section>;

  return <>{notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.text}</Alert> : null}
    <V2Card><Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} justifyContent="space-between"><Stack direction="row" spacing={1} flexWrap="wrap"><Chip label={`${items.length} unassociated library image${items.length === 1 ? "" : "s"}`} /><Chip label={`${productCount} product-linked image reference${productCount === 1 ? "" : "s"}`} variant="outlined" /></Stack>{canManage ? <><input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void upload(event.target.files?.[0] ?? null)} /><V2Button variant="contained" disabled={busy} onClick={() => input.current?.click()}>Upload image</V2Button></> : <Typography variant="body2" color="text.secondary">You have read-only product media access.</Typography>}</Stack><Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.25 }}>JPG, PNG, and WebP only; maximum 20 MB. Library uploads are unassociated until attached to a product.</Typography></V2Card>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><TextField size="small" label="Search media" value={query} onChange={(event) => setQuery(event.target.value)} sx={{ minWidth: { sm: 280 } }} /><FormControl size="small" sx={{ minWidth: 190 }}><InputLabel id="media-filter">Show</InputLabel><Select labelId="media-filter" label="Show" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><MenuItem value="all">All media</MenuItem><MenuItem value="library">Unassociated library</MenuItem><MenuItem value="attached">Product-linked</MenuItem></Select></FormControl></Stack>
    {(filter === "all" || filter === "library") ? librarySection : null}{(filter === "all" || filter === "attached") ? attachedSection : null}
    <Dialog open={Boolean(renameItem)} onClose={() => !busy && setRenameItem(null)} fullWidth maxWidth="xs"><DialogTitle>Rename library image</DialogTitle><DialogContent><TextField autoFocus margin="dense" fullWidth label="Filename" value={rename} onChange={(event) => setRename(event.target.value)} helperText="Keep the current JPG, PNG, or WebP extension." /></DialogContent><DialogActions><Button disabled={busy} onClick={() => setRenameItem(null)}>Cancel</Button><Button disabled={busy || !rename.trim()} variant="contained" onClick={() => void saveRename()}>Save</Button></DialogActions></Dialog>
    <Dialog open={Boolean(associateItem)} onClose={() => !busy && setAssociateItem(null)} fullWidth maxWidth="sm"><DialogTitle>Attach image to product</DialogTitle><DialogContent><Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>The image moves into the selected product’s existing media path, then is attached to its gallery. The library object is retained if attachment does not succeed.</Typography><FormControl fullWidth><InputLabel id="associate-product">Product</InputLabel><Select labelId="associate-product" label="Product" value={productId} onChange={(event) => setProductId(event.target.value)}>{catalog.products.map((product) => <MenuItem key={product.id} value={product.id}>{product.name} ({product.status})</MenuItem>)}</Select></FormControl></DialogContent><DialogActions><Button disabled={busy} onClick={() => setAssociateItem(null)}>Cancel</Button><Button disabled={busy || !productId} variant="contained" onClick={() => void associate()}>Attach image</Button></DialogActions></Dialog>
  </>;
}
