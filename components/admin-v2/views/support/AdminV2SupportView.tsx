"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Box, Card, LinearProgress, Snackbar, Stack, Typography } from "@mui/material";
import { CheckCircle2, Clock3, Inbox, Mail, RefreshCw, SlidersHorizontal } from "lucide-react";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { V2SearchField } from "@/components/admin-v2/shared/V2SearchField";
import type { ConversationStatus } from "@/app/lib/support-store";
import { parseSupportFilter, querySupportInbox, supportHref, type SupportDetail, type SupportFilter, type SupportInboxItem } from "@/lib/admin-v2/support/support-query";
import { supportMetrics } from "@/lib/admin-v2/support/support-metrics";
import { AdminV2SupportInbox } from "./AdminV2SupportInbox";
import { AdminV2SupportContextPanel, AdminV2SupportConversation } from "./AdminV2SupportConversation";

const base = "/api/admin/support/conversations";
const filters: SupportFilter[] = ["all", "open", "pending", "closed", "unread"];
const metricConfig = {
  open: { label: "Open", description: "Active conversations", color: "#20A66A", icon: Inbox },
  pending: { label: "Pending", description: "Awaiting response", color: "#D98B12", icon: Clock3 },
  closed: { label: "Closed", description: "Resolved conversations", color: "#6B7280", icon: CheckCircle2 },
  unread: { label: "Unread messages", description: "New messages", color: "#7C3AED", icon: Mail },
} as const;

type PreparedUpload = {
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  upload_url: string;
};

type ShareableProduct = {
  id: string;
  slug: string;
};

async function readJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: "no-store" });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error("Support request failed");
  return data as T;
}

export function AdminV2SupportView({ canReply, canClose }: { canReply: boolean; canClose: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const query = (params.get("q") ?? "").slice(0, 160);
  const filter = parseSupportFilter(params.get("status"));
  const selected = params.get("conversation") ?? "";
  const [items, setItems] = useState<SupportInboxItem[]>([]);
  const [detail, setDetail] = useState<SupportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const mutationLock = useRef(false);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    setLoading(true);
    setError("");
    setDetailError("");
    setDetail(current => current?.id === selected ? current : null);
    async function load() {
      if (selected) {
        try {
          const conversation = await readJson<SupportDetail>(`${base}/${encodeURIComponent(selected)}?markRead=1`, options);
          if (!controller.signal.aborted) setDetail(conversation);
        } catch {
          if (!controller.signal.aborted) setDetailError("Could not open this conversation. It may no longer be available. Try Refresh.");
        }
      }
      try {
        const result = await readJson<{ conversations: SupportInboxItem[] }>(base, options);
        if (!controller.signal.aborted) setItems(result.conversations);
      } catch {
        if (!controller.signal.aborted) setError("Support inbox is temporarily unavailable. Try Refresh.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [selected, reload]);

  function navigate(nextQuery: string, nextFilter: SupportFilter, conversation: string) {
    setActionError("");
    setNotice("");
    router.push(supportHref(nextQuery, nextFilter, conversation), { scroll: false });
  }

  async function mutate(kind: "reply" | "status" | "markUnread" | "assign" | "attachLabel" | "removeLabel" | "createLabel", value = "", files: File[] = [], extra: Record<string, unknown> = {}) {
    if (mutationLock.current || !detail || detail.id !== selected) return false;
    if (kind === "reply" ? !canReply || detail.status === "closed" : !canClose) return false;
    mutationLock.current = true;
    setBusy(true);
    setActionError("");
    setNotice("");
    try {
      let options: RequestInit;
      if (kind === "reply" && files.length) {
        const prepared = await readJson<{ messageId: string; manifestToken: string; attachments: PreparedUpload[] }>(
          `${base}/${encodeURIComponent(selected)}/attachments/prepare`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              files: files.map(file => ({ file_name: file.name, mime_type: file.type, size_bytes: file.size })),
            }),
          }
        );
        for (const [index, attachment] of prepared.attachments.entries()) {
          const upload = await fetch(attachment.upload_url, {
            method: "PUT",
            headers: { "content-type": files[index]?.type || attachment.mime_type },
            body: files[index],
          });
          if (!upload.ok) throw new Error("Direct attachment upload failed.");
        }
        await readJson(`${base}/${encodeURIComponent(selected)}/attachments/finalize`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            manifestToken: prepared.manifestToken,
            body: value,
          }),
        });
        setNotice("Reply sent.");
        setReload(count => count + 1);
        return true;
      } else {
        options = {
          method: kind === "reply" ? "POST" : "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            kind === "reply" ? { body: value } :
              kind === "markUnread" ? { action: "mark_unread" } :
                kind === "assign" ? { action: "assign", staffId: extra.staffId ?? null, staffName: extra.staffName ?? null } :
                  kind === "attachLabel" ? { action: "attach_label", labelId: extra.labelId } :
                    kind === "removeLabel" ? { action: "remove_label", labelId: extra.labelId } :
                      kind === "createLabel" ? { action: "create_label", labelName: value } :
                        { status: value }
          ),
        };
      }
      await readJson(`${base}/${encodeURIComponent(selected)}${kind === "reply" ? "/reply" : ""}`, options);
      setNotice(kind === "reply" ? "Reply sent." : kind === "markUnread" ? "Conversation marked unread." : kind === "assign" ? "Assignment updated." : kind === "attachLabel" || kind === "createLabel" ? "Label added." : kind === "removeLabel" ? "Label removed." : "Conversation status updated.");
      setReload(count => count + 1);
      return true;
    } catch {
      setActionError(kind === "reply" ? "Could not send reply. Refresh to check conversation status before retrying." : kind === "markUnread" ? "Could not mark unread. Please try again." : kind === "assign" ? "Could not update assignment. Please try again." : kind.includes("Label") ? "Could not update labels. Please try again." : "Could not update status. Please try again.");
      return false;
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }

  async function shareProduct(product: ShareableProduct) {
    if (mutationLock.current || !detail || detail.id !== selected || !canReply || detail.status === "closed") return false;
    mutationLock.current = true;
    setBusy(true);
    setActionError("");
    setNotice("");
    try {
      await readJson(`${base}/${encodeURIComponent(selected)}/shares/product`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: product.id, productSlug: product.slug }),
      });
      setNotice("Product card shared.");
      setReload(count => count + 1);
      return true;
    } catch {
      setActionError("Could not share product. Refresh to check conversation status before retrying.");
      return false;
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }

  const metrics = supportMetrics(items);
  const visible = querySupportInbox(items, query, filter);
  useEffect(() => {
    if (!loading && !selected && visible.length) {
      router.replace(supportHref(query, filter, visible[0].id), { scroll: false });
    }
  }, [filter, loading, query, router, selected, visible]);

  return <Box sx={{ flex: 1, height: "100%", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <Stack direction="row" sx={{ flex: "none", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 1 }}>
      <V2PageHeader title="Support" description="Customer support conversations and live chat." />
      <V2Button variant="outlined" disabled={loading || busy} onClick={() => setReload(count => count + 1)} startIcon={<RefreshCw size={15} />}>Refresh</V2Button>
    </Stack>

    <Box sx={{
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: 0,
      flex: "none",
      mb: 1.5,
      minHeight: 74,
      border: 1,
      borderColor: "rgba(124, 77, 255, 0.14)",
      borderRadius: 3,
      overflow: "hidden",
      background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(249,246,255,0.92))",
      boxShadow: "0 18px 46px rgba(31,25,56,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
    }}>
        {(["open", "pending", "closed", "unread"] as const).map((key, index) => {
          const config = metricConfig[key];
          const Icon = config.icon;
          return <Box key={key} sx={{
            minHeight: 74,
            px: 1.8,
            py: 1.05,
            borderRight: index < 3 ? "1px solid rgba(31,25,56,0.08)" : 0,
            display: "grid",
            gridTemplateColumns: "2.25rem minmax(0, 1fr)",
            gap: 1,
            alignItems: "center",
            bgcolor: index % 2 ? "rgba(124,77,255,0.025)" : "transparent",
          }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: 1.6,
              display: "grid",
              placeItems: "center",
              color: config.color,
              bgcolor: `${config.color}14`,
              border: `1px solid ${config.color}24`,
              boxShadow: `0 8px 18px ${config.color}18`,
            }}><Icon size={17} strokeWidth={2.1} /></Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 900, lineHeight: 1.1 }}>{config.label}</Typography>
              <Typography variant="h5" sx={{ my: 0.05, fontWeight: 950, letterSpacing: "-0.04em", lineHeight: 0.95 }}>{error ? "-" : metrics[key]}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 650 }}>{config.description}</Typography>
            </Box>
          </Box>;
        })}
    </Box>

    <Box sx={{ height: 4, flex: "none" }}>{loading && <LinearProgress aria-label="Loading support" />}</Box>
      {error && <Alert severity="error">{error}</Alert>}
      <Snackbar open={Boolean(notice)} autoHideDuration={2600} onClose={() => setNotice("")} message={notice} role="status" anchorOrigin={{ vertical: "top", horizontal: "right" }} />
      <Box sx={{
        display: "grid",
        gridTemplateColumns: "325px minmax(0, 1fr) 390px",
        gridTemplateRows: "minmax(0, 1fr)",
        alignItems: "stretch",
        gap: 1.5,
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}>
        <Card variant="outlined" sx={{ minWidth: 0, minHeight: 0, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: 3.25, borderColor: "rgba(124, 77, 255, 0.16)", bgcolor: "rgba(255,255,255,0.96)", boxShadow: "0 22px 60px rgba(31,25,56,0.11), inset 0 1px 0 rgba(255,255,255,0.92)" }}>
          <Box sx={{ p: 1.25, pb: 0.8 }}>
            <Box component="form" onSubmit={event => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              navigate(String(form.get("q") ?? "").slice(0, 160), filter, selected);
            }} sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 34px", gap: 0.55, alignItems: "center" }}>
              <V2SearchField key={query} name="q" defaultValue={query} placeholder="Search conversations, customer, or message..." slotProps={{ htmlInput: { "aria-label": "Search support conversations", maxLength: 160 } }} sx={{ "& .MuiInputBase-root": { height: 40 }, "& input": { fontSize: 12.4, px: 1.05 }, "& input::placeholder": { opacity: 0.86 } }} />
              <V2Button type="submit" variant="outlined" disabled={busy} aria-label="Search support conversations" sx={{ minWidth: 34, width: 34, height: 40, px: 0 }}><SlidersHorizontal size={16} /></V2Button>
            </Box>
            <Stack direction="row" role="tablist" aria-label="Support status filters" sx={{ gap: 0.55, pt: 1, overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
              {filters.map(value => <V2Button key={value} size="small" variant={filter === value ? "contained" : "outlined"} disabled={busy}
                role="tab" aria-selected={filter === value} aria-pressed={filter === value} onClick={() => navigate(query, value, selected)}
                sx={{ borderRadius: 999, minWidth: "auto", px: 1.35, py: 0.55, flexShrink: 0 }}>{value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)}</V2Button>)}
            </Stack>
          </Box>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1, px: 1.6, py: 1.05, borderTop: 1, borderBottom: 1, borderColor: "rgba(31, 25, 56, 0.07)" }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 850 }}>{visible.length} conversations · Times in Bangladesh</Typography>
            <Typography variant="caption" sx={{ flexShrink: 0, fontWeight: 850, color: "#6D5B8E", bgcolor: "rgba(124,77,255,0.08)", border: "1px solid rgba(124,77,255,0.12)", borderRadius: 999, px: 1, py: 0.25 }}>Sort: Latest</Typography>
          </Stack>
          {!loading && !error && !visible.length && <Typography color="text.secondary" sx={{ p: 3 }}>{items.length ? "No conversations match this search or filter." : "No support conversations yet."}</Typography>}
          <AdminV2SupportInbox items={visible} selected={selected} disabled={busy} onSelect={id => navigate(query, filter, id)} />
        </Card>
        <Card variant="outlined" sx={{ minWidth: 0, minHeight: 0, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: 3.25, borderColor: "rgba(124, 77, 255, 0.16)", bgcolor: "background.paper", boxShadow: "0 22px 60px rgba(31,25,56,0.1), inset 0 1px 0 rgba(255,255,255,0.92)" }} aria-busy={loading}>
          {detailError ? <Alert severity="error" sx={{ m: 2.5 }}>{detailError}</Alert> : detail && detail.id === selected ?
            <AdminV2SupportConversation conversation={detail} canReply={canReply} canClose={canClose} busy={busy || loading}
              actionError={actionError} onReply={(body, files) => mutate("reply", body, files)}
              onProductShare={shareProduct}
              onStatus={(status: ConversationStatus) => { void mutate("status", status); }}
              onRefresh={() => setReload(count => count + 1)}
              onMarkUnread={() => { void mutate("markUnread"); }} /> :
            <Box sx={{ p: 6, textAlign: "center", m: "auto" }}><Typography variant="h6">{selected && loading ? "Loading conversation..." : "Select a conversation"}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Read the history and respond from this workspace.</Typography></Box>}
        </Card>
        <Card variant="outlined" sx={{ minWidth: 0, minHeight: 0, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: 3.25, borderColor: "rgba(124, 77, 255, 0.16)", bgcolor: "rgba(255,255,255,0.96)", boxShadow: "0 22px 60px rgba(31,25,56,0.1), inset 0 1px 0 rgba(255,255,255,0.92)" }}>
          {detail && detail.id === selected ? <AdminV2SupportContextPanel conversation={detail} canClose={canClose} busy={busy || loading}
            onStatus={(status: ConversationStatus) => { void mutate("status", status); }}
            onAssign={(staffId, staffName) => { void mutate("assign", "", [], { staffId, staffName }); }}
            onAttachLabel={(labelId) => { void mutate("attachLabel", "", [], { labelId }); }}
            onRemoveLabel={(labelId) => { void mutate("removeLabel", "", [], { labelId }); }}
            onCreateLabel={(labelName) => { void mutate("createLabel", labelName); }} /> :
            <Box sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Customer context</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>Select a conversation to see source, timeline, status, and customer details.</Typography>
            </Box>}
        </Card>
      </Box>
  </Box>;
}
