"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Box, Card, LinearProgress, Stack, Typography } from "@mui/material";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { V2SearchField } from "@/components/admin-v2/shared/V2SearchField";
import type { ConversationStatus } from "@/app/lib/support-store";
import { parseSupportFilter, querySupportInbox, supportHref, type SupportDetail, type SupportFilter, type SupportInboxItem } from "@/lib/admin-v2/support/support-query";
import { supportMetrics } from "@/lib/admin-v2/support/support-metrics";
import { AdminV2SupportInbox } from "./AdminV2SupportInbox";
import { AdminV2SupportConversation } from "./AdminV2SupportConversation";

const base = "/api/admin/support/conversations";
const filters: SupportFilter[] = ["all", "open", "pending", "closed", "unread"];

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
    setError(""); setDetailError("");
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
      // Fetch counts after the existing mark-read request has completed.
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
    setActionError(""); setNotice("");
    router.push(supportHref(nextQuery, nextFilter, conversation), { scroll: false });
  }

  async function mutate(kind: "reply" | "status", value: string) {
    if (mutationLock.current || !detail || detail.id !== selected) return false;
    if (kind === "reply" ? !canReply || detail.status === "closed" : !canClose) return false;
    mutationLock.current = true; setBusy(true); setActionError(""); setNotice("");
    try {
      await readJson(`${base}/${encodeURIComponent(selected)}${kind === "reply" ? "/reply" : ""}`, {
        method: kind === "reply" ? "POST" : "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify(kind === "reply" ? { body: value } : { status: value }),
      });
      setNotice(kind === "reply" ? "Reply sent." : "Conversation status updated.");
      setReload(count => count + 1);
      return true;
    } catch {
      setActionError(kind === "reply" ? "Could not send reply. Refresh to check conversation status before retrying." : "Could not update status. Please try again.");
      return false;
    } finally {
      mutationLock.current = false; setBusy(false);
    }
  }

  const metrics = supportMetrics(items);
  const visible = querySupportInbox(items, query, filter);
  return <>
    <V2PageHeader title="Support" description="Customer support conversations and live chat." />
    <Card variant="outlined" sx={{ overflow: "hidden" }}>
      <Stack direction="row" sx={{ borderBottom: 1, borderColor: "divider" }}>
        {(["open", "pending", "closed", "unread"] as const).map((key, index) => <Box key={key} sx={{ flex: 1, px: 3, py: 2, borderLeft: index ? 1 : 0, borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>{key}{key === "unread" ? " messages" : ""}</Typography>
          <Typography variant="h6">{error ? "—" : metrics[key]}</Typography>
        </Box>)}
      </Stack>
      <Stack direction="row" sx={{ p: 2.5, gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Box component="form" onSubmit={event => {
          event.preventDefault(); const form = new FormData(event.currentTarget);
          navigate(String(form.get("q") ?? "").slice(0, 160), filter, selected);
        }} sx={{ display: "flex", gap: 1, flex: "1 1 320px", maxWidth: 500 }}>
          <V2SearchField key={query} name="q" defaultValue={query} placeholder="Search conversation, source, or preview" slotProps={{ htmlInput: { "aria-label": "Search support conversations", maxLength: 160 } }} />
          <V2Button type="submit" variant="contained" disabled={busy}>Search</V2Button>
        </Box>
        <Stack direction="row" sx={{ gap: 0.75 }}>
          {filters.map(value => <V2Button key={value} size="small" variant={filter === value ? "contained" : "text"} disabled={busy}
            aria-pressed={filter === value} onClick={() => navigate(query, value, selected)}>{value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)}</V2Button>)}
        </Stack>
        <V2Button variant="outlined" disabled={loading || busy} onClick={() => setReload(count => count + 1)}>Refresh</V2Button>
      </Stack>
      <Box sx={{ height: 4 }}>{loading && <LinearProgress aria-label="Loading support" />}</Box>
      {error && <Alert severity="error">{error}</Alert>}
      {actionError && <Alert severity="error">{actionError}</Alert>}
      {notice && <Alert severity="success" role="status">{notice}</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: "minmax(280px, 34%) minmax(0, 1fr)", borderTop: 1, borderColor: "divider", minHeight: 540 }}>
        <Box sx={{ borderRight: 1, borderColor: "divider", minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 2.5, py: 1.5, borderBottom: 1, borderColor: "divider" }}>{visible.length} conversations · Times in Bangladesh</Typography>
          {!loading && !error && !visible.length && <Typography color="text.secondary" sx={{ p: 3 }}>{items.length ? "No conversations match this search or filter." : "No support conversations yet."}</Typography>}
          <AdminV2SupportInbox items={visible} selected={selected} disabled={busy} onSelect={id => navigate(query, filter, id)} />
        </Box>
        <Box sx={{ minWidth: 0 }} aria-busy={loading}>
          {detailError ? <Alert severity="error" sx={{ m: 2.5 }}>{detailError}</Alert> : detail && detail.id === selected ?
            <AdminV2SupportConversation conversation={detail} canReply={canReply} canClose={canClose} busy={busy || loading}
              onReply={body => mutate("reply", body)} onStatus={(status: ConversationStatus) => { void mutate("status", status); }} /> :
            <Box sx={{ p: 6, textAlign: "center" }}><Typography variant="h6">{selected && loading ? "Loading conversation…" : "Select a conversation"}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Read the history and respond from this workspace.</Typography></Box>}
        </Box>
      </Box>
    </Card>
  </>;
}
