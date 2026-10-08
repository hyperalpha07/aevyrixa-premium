"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { CheckCircle2, FileCheck2, Plus, ShieldCheck, XCircle } from "lucide-react";
import { V2Breadcrumbs } from "@/components/admin-v2/shared/V2Breadcrumbs";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2Chip } from "@/components/admin-v2/shared/V2Chip";
import type { ApprovalRequest, ApprovalStatus } from "@/lib/admin-v2/approvals/approvals-store";

const tabs: Array<{ label: string; status: ApprovalStatus | "all"; mine?: boolean }> = [
  { label: "Pending", status: "pending" },
  { label: "Approved", status: "approved" },
  { label: "Rejected", status: "rejected" },
  { label: "Cancelled", status: "cancelled" },
  { label: "My Requests", status: "all", mine: true },
];

const categories = ["access", "operations", "finance", "customer", "content", "settings", "other"];

type Props = {
  permissions: {
    canRequest: boolean;
    canDecide: boolean;
    isOwner: boolean;
    actorType: "owner" | "staff";
    actorId: string;
  };
};

type FormState = {
  title: string;
  category: string;
  actionKey: string;
  subjectType: string;
  subjectId: string;
  summary: string;
  reason: string;
};

const emptyForm: FormState = {
  title: "",
  category: "operations",
  actionKey: "",
  subjectType: "",
  subjectId: "",
  summary: "",
  reason: "",
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date) : "Not provided";
}

function statusColor(status: ApprovalStatus): "success" | "warning" | "error" | "default" {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  if (status === "cancelled") return "default";
  return "warning";
}

function label(value: string) {
  return value.replace(/[._:-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isOwnRequest(approval: ApprovalRequest | null, permissions: Props["permissions"]) {
  return Boolean(approval && approval.requestedByType === permissions.actorType && approval.requestedById === permissions.actorId);
}

export function AdminV2ApprovalsView({ permissions }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [decisionOpen, setDecisionOpen] = useState<"approved" | "rejected" | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const tab = tabs[activeTab];

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (tab.status !== "all") params.set("status", tab.status);
    if (tab.mine) params.set("mine", "1");
    try {
      const response = await fetch(`/api/admin/approvals?${params.toString()}`, { cache: "no-store" });
      const data = (await response.json()) as { approvals?: ApprovalRequest[]; errors?: string[] };
      if (!response.ok) throw new Error(data.errors?.[0] ?? "Approvals could not be loaded.");
      setApprovals(data.approvals ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Approvals could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [tab.mine, tab.status]);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => ({
    total: approvals.length,
    pending: approvals.filter((approval) => approval.status === "pending").length,
    terminal: approvals.filter((approval) => approval.status !== "pending").length,
  }), [approvals]);

  async function createRequest() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          actionKey: form.actionKey.trim().toLowerCase(),
        }),
      });
      const data = (await response.json()) as { approval?: ApprovalRequest; errors?: string[] };
      if (!response.ok) throw new Error(data.errors?.[0] ?? "Approval request could not be created.");
      setCreateOpen(false);
      setForm(emptyForm);
      await load();
      if (data.approval) setSelected(data.approval);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Approval request could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  async function decide() {
    if (!selected || !decisionOpen) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/approvals/${encodeURIComponent(selected.id)}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: decisionOpen, note: decisionNote }),
      });
      const data = (await response.json()) as { approval?: ApprovalRequest; errors?: string[] };
      if (!response.ok) throw new Error(data.errors?.[0] ?? "Decision could not be recorded.");
      setDecisionOpen(null);
      setDecisionNote("");
      await load();
      if (data.approval) setSelected(data.approval);
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Decision could not be recorded.");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelRequest() {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/approvals/${encodeURIComponent(selected.id)}/cancel`, { method: "POST" });
      const data = (await response.json()) as { approval?: ApprovalRequest; errors?: string[] };
      if (!response.ok) throw new Error(data.errors?.[0] ?? "Approval request could not be cancelled.");
      await load();
      if (data.approval) setSelected(data.approval);
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Approval request could not be cancelled.");
    } finally {
      setSubmitting(false);
    }
  }

  const canCancelSelected = selected?.status === "pending" && (permissions.isOwner || isOwnRequest(selected, permissions));
  const canDecideSelected = selected?.status === "pending" && permissions.canDecide;
  const ownerSelfDecision = Boolean(selected && permissions.isOwner && isOwnRequest(selected, permissions));

  return (
    <Box component="section" aria-labelledby="admin-v2-approvals-title">
      <Box sx={{ mb: 1.25 }}>
        <V2Breadcrumbs items={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Approvals" }]} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 0.5, alignItems: { sm: "center" }, justifyContent: "space-between" }}>
          <Box>
            <Typography id="admin-v2-approvals-title" component="h1" variant="h4">
              Approvals
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Governance decisions are recorded here. Approved means decision recorded; it does not execute a business action.
            </Typography>
          </Box>
          {permissions.canRequest ? (
            <V2Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
              Create Request
            </V2Button>
          ) : null}
        </Stack>
      </Box>

      <Stack spacing={1.2}>
        {error ? <Alert severity="error" onClose={() => setError("")}>{error}</Alert> : null}

        <V2Card sx={{ "& .MuiCardContent-root": { p: 1.25, "&:last-child": { pb: 1.25 } } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              {tabs.map((item, index) => (
                <Button key={item.label} size="small" variant={activeTab === index ? "contained" : "outlined"} onClick={() => setActiveTab(index)}>
                  {item.label}
                </Button>
              ))}
            </Stack>
            <Stack direction="row" spacing={1}>
              <V2Chip label={`${metrics.total} shown`} color="primary" />
              <V2Chip label={`${metrics.pending} pending`} color="warning" />
              <V2Chip label={`${metrics.terminal} resolved`} color="success" />
            </Stack>
          </Stack>
        </V2Card>

        {loading ? <Alert severity="info">Loading approvals…</Alert> : null}
        {!loading && approvals.length === 0 ? <Alert severity="info">No approval requests match this view.</Alert> : null}

        <Stack spacing={1}>
          {approvals.map((approval) => (
            <V2Card key={approval.id} interactive selected={selected?.id === approval.id} onClick={() => setSelected(approval)} sx={{ "& .MuiCardContent-root": { p: 1.5, "&:last-child": { pb: 1.5 } } }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{approval.reference}</Typography>
                    <V2Chip size="small" label={label(approval.status)} color={statusColor(approval.status)} />
                    <V2Chip size="small" label={label(approval.category)} />
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{approval.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {label(approval.actionKey)} · {approval.subjectType || "No subject"} {approval.subjectId ? `· ${approval.subjectId}` : ""}
                  </Typography>
                </Box>
                <Stack spacing={0.25} sx={{ minWidth: { md: 220 } }}>
                  <Typography variant="caption" color="text.secondary">Requested by</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{approval.requestedByName}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatDate(approval.requestedAt)}</Typography>
                </Stack>
              </Stack>
            </V2Card>
          ))}
        </Stack>
      </Stack>

      <Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 520 }, p: 2 } } }}>
        {selected ? (
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>{selected.reference}</Typography>
              <V2Chip label={label(selected.status)} color={statusColor(selected.status)} />
            </Stack>
            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{selected.title}</Typography>
            <Alert severity="info" icon={<ShieldCheck size={18} />}>Decision recorded only. This phase does not execute business actions.</Alert>
            <Box>
              <Typography variant="caption" color="text.secondary">Summary</Typography>
              <Typography variant="body2">{selected.summary}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Reason</Typography>
              <Typography variant="body2">{selected.reason}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Safe payload summary</Typography>
              <Typography component="pre" variant="caption" sx={{ display: "block", whiteSpace: "pre-wrap", p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1.5, bgcolor: "background.default", maxHeight: 220, overflow: "auto" }}>
                {JSON.stringify(selected.requestPayload ?? {}, null, 2)}
              </Typography>
            </Box>
            {selected.resolutionNote ? (
              <Box>
                <Typography variant="caption" color="text.secondary">Decision note</Typography>
                <Typography variant="body2">{selected.resolutionNote}</Typography>
              </Box>
            ) : null}
            <Divider />
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Event history</Typography>
            <Stack spacing={1}>
              {selected.events.map((event) => (
                <Stack key={event.id} direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                  {event.eventType === "approved" ? <CheckCircle2 size={16} /> : event.eventType === "rejected" ? <XCircle size={16} /> : <FileCheck2 size={16} />}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{label(event.eventType)} by {event.actorName}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatDate(event.createdAt)}</Typography>
                    {event.note ? <Typography variant="caption" sx={{ display: "block" }}>{event.note}</Typography> : null}
                  </Box>
                </Stack>
              ))}
            </Stack>
            <Divider />
            {ownerSelfDecision ? <Alert severity="warning">Owner self-decision override requires a note.</Alert> : null}
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              {canDecideSelected ? (
                <>
                  <Button variant="contained" color="success" disabled={submitting} onClick={() => setDecisionOpen("approved")}>Approve</Button>
                  <Button variant="contained" color="error" disabled={submitting} onClick={() => setDecisionOpen("rejected")}>Reject</Button>
                </>
              ) : null}
              {canCancelSelected ? <Button variant="outlined" disabled={submitting} onClick={cancelRequest}>Cancel Request</Button> : null}
            </Stack>
          </Stack>
        ) : null}
      </Drawer>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create approval request</DialogTitle>
        <DialogContent>
          <Stack spacing={1.25} sx={{ pt: 0.5 }}>
            <TextField label="Title" size="small" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            <TextField select label="Category" size="small" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              {categories.map((category) => <MenuItem key={category} value={category}>{label(category)}</MenuItem>)}
            </TextField>
            <TextField label="Action key" helperText="Lowercase stable identifier, e.g. refund.review" size="small" value={form.actionKey} onChange={(event) => setForm({ ...form, actionKey: event.target.value })} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField label="Subject type (optional)" size="small" fullWidth value={form.subjectType} onChange={(event) => setForm({ ...form, subjectType: event.target.value })} />
              <TextField label="Subject ID (optional)" size="small" fullWidth value={form.subjectId} onChange={(event) => setForm({ ...form, subjectId: event.target.value })} />
            </Stack>
            <TextField label="Summary" multiline minRows={2} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
            <TextField label="Reason" multiline minRows={3} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={submitting} onClick={createRequest}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(decisionOpen)} onClose={() => setDecisionOpen(null)} fullWidth maxWidth="sm">
        <DialogTitle>{decisionOpen === "approved" ? "Approve request" : "Reject request"}</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">This records a governance decision only. It does not execute a business action.</Typography>
            <TextField label={decisionOpen === "rejected" || ownerSelfDecision ? "Decision note (required)" : "Decision note (optional)"} multiline minRows={3} value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecisionOpen(null)}>Cancel</Button>
          <Button variant="contained" disabled={submitting} onClick={decide}>{decisionOpen === "approved" ? "Approve" : "Reject"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
