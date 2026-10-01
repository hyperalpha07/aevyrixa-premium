"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, ButtonBase, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Popover, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { ImageIcon, MessageSquareText, PackageSearch, Paperclip, SmilePlus } from "lucide-react";
import { supportAttachmentAccept, validateSupportAttachmentFiles } from "@/app/lib/support-attachment-rules";
import { V2Button } from "@/components/admin-v2/shared/V2Button";

type SavedReply = {
  id: string;
  title: string;
  text: string;
  updatedAt: string;
};

type ProductPick = {
  id: string;
  slug: string;
  name: string;
  price?: number;
  currency?: string;
  stockStatus?: string;
  status?: string;
  primaryImageUrl?: string;
  imageUrl?: string;
  images?: string[];
};

const emojis = ["😊", "🙏", "💜", "✨", "👍", "✅", "📦", "🌸"];

function savedReplyKey() {
  return "noromi-admin-support-saved-replies";
}

function loadSavedReplies(): SavedReply[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(savedReplyKey()) || "[]") as SavedReply[];
    return Array.isArray(parsed) ? parsed.filter(reply => reply && typeof reply.title === "string" && typeof reply.text === "string") : [];
  } catch {
    return [];
  }
}

export function AdminV2SupportComposer({ busy, error, onReply, onInternalNote, onProductShare }: {
  busy: boolean;
  error: string;
  onReply: (body: string, files: File[]) => Promise<boolean>;
  onInternalNote?: (body: string) => Promise<boolean> | boolean;
  onProductShare?: (product: ProductPick) => Promise<boolean>;
}) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
  const [productAnchor, setProductAnchor] = useState<HTMLElement | null>(null);
  const [savedAnchor, setSavedAnchor] = useState<HTMLElement | null>(null);
  const [products, setProducts] = useState<ProductPick[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [savedReplies, setSavedReplies] = useState<SavedReply[]>([]);
  const [savedQuery, setSavedQuery] = useState("");
  const [editingReply, setEditingReply] = useState<SavedReply | null>(null);
  const [replyTitle, setReplyTitle] = useState("");
  const [replyText, setReplyText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);

  useEffect(() => {
    setSavedReplies(loadSavedReplies());
  }, []);

  useEffect(() => {
    function switchToNote() {
      setMode("note");
      setFiles([]);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
    window.addEventListener("noromi-support:add-note", switchToNote);
    return () => window.removeEventListener("noromi-support:add-note", switchToNote);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(savedReplyKey(), JSON.stringify(savedReplies));
    }
  }, [savedReplies]);

  useEffect(() => {
    if (!productAnchor || products.length) return;
    let cancelled = false;
    fetch("/api/products?scope=admin", { cache: "no-store" })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("products unavailable")))
      .then((data: { products?: ProductPick[] }) => {
        if (!cancelled) setProducts((data.products ?? []).map(product => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          currency: product.currency,
          stockStatus: product.stockStatus,
          status: product.status,
          primaryImageUrl: product.primaryImageUrl,
          imageUrl: product.imageUrl,
          images: product.images,
        })));
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => { cancelled = true; };
  }, [productAnchor, products.length]);

  function updateFiles(nextFiles: File[]) {
    const validation = validateSupportAttachmentFiles(nextFiles);
    if (validation) {
      setFileError(validation);
      return;
    }
    setFileError("");
    setFiles(nextFiles);
  }

  async function submitReply() {
    const value = body.trim();
    if (busy || submitting.current || (!value && !files.length)) return;
    submitting.current = true;
    try {
      if (mode === "note") {
        if (!value || !onInternalNote) return;
        if (await onInternalNote(value)) setBody("");
        return;
      }
      if (await onReply(value, files)) {
        setBody("");
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } finally {
      submitting.current = false;
    }
  }

  function insertText(text: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody(current => `${current}${text}`);
      return;
    }
    const start = textarea.selectionStart ?? body.length;
    const end = textarea.selectionEnd ?? body.length;
    const next = `${body.slice(0, start)}${text}${body.slice(end)}`;
    setBody(next.slice(0, 4000));
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = Math.min(start + text.length, 4000);
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  async function insertProduct(product: ProductPick) {
    if (!onProductShare) return;
    await onProductShare(product);
    setProductAnchor(null);
  }

  function startSavedReplyEdit(reply?: SavedReply) {
    setEditingReply(reply ?? { id: "", title: "", text: "", updatedAt: "" });
    setReplyTitle(reply?.title ?? "");
    setReplyText(reply?.text ?? "");
  }

  function saveReplyTemplate() {
    const title = replyTitle.trim();
    const text = replyText.trim();
    if (!title || !text) return;
    const now = new Date().toISOString();
    setSavedReplies(current => {
      if (editingReply?.id) {
        return current.map(reply => reply.id === editingReply.id ? { ...reply, title, text, updatedAt: now } : reply);
      }
      return [{ id: crypto.randomUUID(), title, text, updatedAt: now }, ...current];
    });
    setEditingReply(null);
    setReplyTitle("");
    setReplyText("");
  }

  const filteredProducts = useMemo(() => {
    const term = productQuery.trim().toLowerCase();
    return products
      .filter(product => product.status === "active")
      .filter(product => !term || [product.name, product.slug, product.stockStatus ?? ""].some(value => value.toLowerCase().includes(term)))
      .slice(0, 8);
  }, [productQuery, products]);

  const filteredReplies = useMemo(() => {
    const term = savedQuery.trim().toLowerCase();
    return savedReplies.filter(reply => !term || [reply.title, reply.text].some(value => value.toLowerCase().includes(term)));
  }, [savedQuery, savedReplies]);

  return <Box component="form" ref={formRef} onSubmit={event => {
    event.preventDefault();
    void submitReply();
  }} sx={{ p: 1.45, borderTop: 1, borderColor: "rgba(31, 25, 56, 0.08)", bgcolor: "rgba(255, 255, 255, 0.96)", flexShrink: 0 }}>
    {error && <Typography color="error" sx={{ mb: 1, fontWeight: 700 }}>{error}</Typography>}
    {fileError && <Typography color="error" sx={{ mb: 1, fontWeight: 700 }}>{fileError}</Typography>}
    <Box sx={{
      p: 1.1,
      border: 1,
      borderColor: "rgba(124, 77, 255, 0.2)",
      borderRadius: 2.75,
      bgcolor: "background.paper",
      boxShadow: "0 14px 30px rgba(31,25,56,0.08), inset 0 1px 0 rgba(255, 255, 255, 0.82)",
    }}>
      <input ref={fileInputRef} type="file" multiple accept={supportAttachmentAccept()} hidden
        onChange={event => updateFiles([...files, ...Array.from(event.target.files ?? [])])} />
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.85 }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.45, p: 0.25, borderRadius: 2.1, bgcolor: "rgba(124,77,255,0.07)", border: "1px solid rgba(124,77,255,0.12)" }}>
          {(["reply", "note"] as const).map(value => <ButtonBase key={value} onClick={() => { setMode(value); setFiles([]); }}
            sx={{
              gap: 0.55,
              px: 1.1,
              py: 0.55,
              borderRadius: 1.7,
              color: mode === value ? "primary.main" : "text.secondary",
              bgcolor: mode === value ? "background.paper" : "transparent",
              boxShadow: mode === value ? "0 8px 18px rgba(124,77,255,0.12)" : "none",
              fontWeight: 950,
            }}>
            <MessageSquareText size={14} />
            <Typography variant="caption" sx={{ fontWeight: 950 }}>{value === "reply" ? "Reply" : "Internal Note"}</Typography>
          </ButtonBase>)}
        </Stack>
        <V2Button variant="outlined" size="small" onClick={event => setSavedAnchor(event.currentTarget)} sx={{ borderRadius: 2 }}>Saved Replies</V2Button>
      </Stack>
      <TextField placeholder="Write a helpful reply..." fullWidth multiline minRows={2} maxRows={4}
        value={body} disabled={busy}
        onChange={event => setBody(event.target.value)}
        onKeyDown={event => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
        slotProps={{ htmlInput: { maxLength: 4000, "aria-label": mode === "note" ? "Private internal note" : "Reply to customer", ref: textareaRef } }}
        sx={{
          "& .MuiInputBase-root": { p: 0, border: 0, bgcolor: "transparent" },
          "& .MuiOutlinedInput-notchedOutline": { border: 0 },
          "& textarea": {
            boxSizing: "border-box",
            minHeight: 72,
            maxHeight: 152,
            p: "14px 16px",
            borderRadius: "14px",
            lineHeight: 1.52,
            fontSize: 14.5,
            bgcolor: mode === "note" ? "rgba(255,246,217,0.55)" : "rgba(250,249,255,0.72)",
            border: mode === "note" ? "1px solid rgba(217,139,18,0.24)" : "1px solid rgba(124,77,255,0.11)",
          },
        }} />
      {files.length > 0 && <Stack direction="row" sx={{ mt: 1.15, gap: 0.75, flexWrap: "wrap" }} aria-label="Selected attachments">
        {files.map((file, index) => <Chip key={`${file.name}-${file.size}-${index}`} size="small" label={file.name || "attachment"}
          onDelete={() => updateFiles(files.filter((_, fileIndex) => fileIndex !== index))}
          sx={{ maxWidth: 220, fontWeight: 700 }} />)}
      </Stack>}
      <Stack direction="row" sx={{ mt: 0.95, justifyContent: "space-between", alignItems: "center", gap: 1.1, flexWrap: "nowrap" }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.45, minWidth: 0, flexShrink: 0 }}>
          {mode === "reply" && <Tooltip title="Attach files">
            <span>
              <IconButton aria-label="Attach files" disabled={busy || submitting.current} onClick={() => fileInputRef.current?.click()}
                sx={{
                  width: 36,
                  height: 36,
                  border: "1px solid rgba(124,77,255,0.18)",
                  color: "#6D5B8E",
                  bgcolor: "rgba(124,77,255,0.055)",
                  "&:hover": { bgcolor: "rgba(124,77,255,0.1)" },
                }}>
                <Paperclip size={17} />
              </IconButton>
            </span>
          </Tooltip>}
          {mode === "reply" && <Tooltip title="Attach image or file"><span><IconButton aria-label="Attach image or file" disabled={busy || submitting.current} onClick={() => fileInputRef.current?.click()} sx={{ width: 36, height: 36, color: "#6D5B8E" }}><ImageIcon size={17} /></IconButton></span></Tooltip>}
          <Tooltip title="Insert emoji"><span><IconButton aria-label="Insert emoji" disabled={busy} onClick={event => setEmojiAnchor(event.currentTarget)} sx={{ width: 36, height: 36, color: "#6D5B8E" }}><SmilePlus size={17} /></IconButton></span></Tooltip>
          {mode === "reply" && <ButtonBase aria-label="Share product card" disabled={busy || !onProductShare} onClick={event => setProductAnchor(event.currentTarget)}
            sx={{
              height: 36,
              px: 1.05,
              gap: 0.55,
              borderRadius: 999,
              border: "1px solid rgba(124,77,255,0.18)",
              color: "#5F3DB9",
              bgcolor: "rgba(124,77,255,0.055)",
              fontSize: 12.5,
              fontWeight: 900,
              "&:hover": { bgcolor: "rgba(124,77,255,0.1)" },
              "&.Mui-disabled": { opacity: 0.45 },
            }}>
            <PackageSearch size={15} />
            Product
          </ButtonBase>}
        </Stack>
        <Stack direction="row" sx={{ gap: 0.75, alignItems: "center", flexShrink: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 52, textAlign: "right", fontWeight: 750, whiteSpace: "nowrap" }}>{body.length} / 4000</Typography>
          <V2Button type="submit" variant="contained" loading={busy} disabled={busy || submitting.current || (!body.trim() && !files.length)}
            sx={{ minWidth: 104, borderRadius: 2, py: 0.95, px: 1.4, boxShadow: "0 14px 28px rgba(124,77,255,0.25)", whiteSpace: "nowrap" }}>{mode === "note" ? "Add Note" : "Send Reply"}</V2Button>
        </Stack>
      </Stack>
    </Box>
    <Popover open={Boolean(emojiAnchor)} anchorEl={emojiAnchor} onClose={() => setEmojiAnchor(null)} anchorOrigin={{ vertical: "top", horizontal: "left" }} transformOrigin={{ vertical: "bottom", horizontal: "left" }}>
      <Stack direction="row" sx={{ p: 1, gap: 0.4, flexWrap: "wrap", width: 184 }}>
        {emojis.map(emoji => <ButtonBase key={emoji} onClick={() => { insertText(emoji); setEmojiAnchor(null); }} sx={{ width: 34, height: 34, borderRadius: 1.5, fontSize: 18, "&:hover": { bgcolor: "rgba(124,77,255,0.08)" } }}>{emoji}</ButtonBase>)}
      </Stack>
    </Popover>
    <Popover open={Boolean(productAnchor)} anchorEl={productAnchor} onClose={() => setProductAnchor(null)} anchorOrigin={{ vertical: "top", horizontal: "left" }} transformOrigin={{ vertical: "bottom", horizontal: "left" }}>
      <Box sx={{ p: 1.25, width: 340 }}>
        <TextField size="small" fullWidth placeholder="Search real products..." value={productQuery} onChange={event => setProductQuery(event.target.value)} />
        <Stack sx={{ mt: 1, gap: 0.65, maxHeight: 280, overflowY: "auto" }}>
          {filteredProducts.length ? filteredProducts.map(product => {
            const image = product.primaryImageUrl || product.imageUrl || product.images?.[0] || "";
            const price = typeof product.price === "number" ? `${product.currency || "BDT"} ${product.price}` : "Price unavailable";
            const stock = (product.stockStatus || "stock unknown").replace(/_/g, " ");
            return <ButtonBase key={product.id} onClick={() => { void insertProduct(product); }} sx={{ display: "grid", gridTemplateColumns: "48px minmax(0, 1fr)", gap: 1, textAlign: "left", p: 0.85, borderRadius: 1.75, border: "1px solid rgba(31,25,56,0.08)", "&:hover": { bgcolor: "rgba(124,77,255,0.07)", borderColor: "rgba(124,77,255,0.18)" } }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 1.5, overflow: "hidden", bgcolor: "rgba(124,77,255,0.08)", display: "grid", placeItems: "center" }}>
                {image ? <Box component="img" src={image} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <PackageSearch size={18} color="#6D5B8E" />}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", textTransform: "capitalize" }}>{price} · {stock}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>/product/{product.slug}</Typography>
              </Box>
          </ButtonBase>;
          }) : <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>No real products found.</Typography>}
        </Stack>
      </Box>
    </Popover>
    <Popover open={Boolean(savedAnchor)} anchorEl={savedAnchor} onClose={() => setSavedAnchor(null)} anchorOrigin={{ vertical: "top", horizontal: "right" }} transformOrigin={{ vertical: "bottom", horizontal: "right" }}>
      <Box sx={{ p: 1.25, width: 380 }}>
        <Stack direction="row" sx={{ gap: 1, mb: 1 }}>
          <TextField size="small" fullWidth placeholder="Search saved replies..." value={savedQuery} onChange={event => setSavedQuery(event.target.value)} />
          <V2Button variant="contained" size="small" onClick={() => startSavedReplyEdit()}>Create</V2Button>
        </Stack>
        <Stack sx={{ gap: 0.7, maxHeight: 300, overflowY: "auto" }}>
          {filteredReplies.length ? filteredReplies.map(reply => <Box key={reply.id} sx={{ p: 1, border: "1px solid rgba(31,25,56,0.08)", borderRadius: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>{reply.title}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>{reply.text.slice(0, 100)}</Typography>
            <Stack direction="row" sx={{ gap: 0.75, mt: 0.75 }}>
              <V2Button size="small" variant="contained" onClick={() => { insertText(reply.text); setSavedAnchor(null); }}>Use</V2Button>
              <V2Button size="small" variant="outlined" onClick={() => startSavedReplyEdit(reply)}>Edit</V2Button>
              <V2Button size="small" variant="text" onClick={() => setSavedReplies(current => current.filter(item => item.id !== reply.id))}>Delete</V2Button>
            </Stack>
          </Box>) : <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>No saved replies yet. Create one to reuse it later.</Typography>}
        </Stack>
      </Box>
    </Popover>
    <Dialog open={Boolean(editingReply)} onClose={() => setEditingReply(null)} fullWidth maxWidth="sm">
      <DialogTitle>{editingReply?.id ? "Edit saved reply" : "Create saved reply"}</DialogTitle>
      <DialogContent>
        <Stack sx={{ gap: 1.5, pt: 0.5 }}>
          <TextField label="Title" value={replyTitle} onChange={event => setReplyTitle(event.target.value)} fullWidth />
          <TextField label="Reply text" value={replyText} onChange={event => setReplyText(event.target.value)} fullWidth multiline minRows={5} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <V2Button variant="text" onClick={() => setEditingReply(null)}>Cancel</V2Button>
        <V2Button variant="contained" onClick={saveReplyTemplate} disabled={!replyTitle.trim() || !replyText.trim()}>Save</V2Button>
      </DialogActions>
    </Dialog>
  </Box>;
}
