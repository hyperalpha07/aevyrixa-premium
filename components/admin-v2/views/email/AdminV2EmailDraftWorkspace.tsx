"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Button, Chip, Divider, Stack, TextField, Typography } from "@mui/material";
import type { AdminEmailDraft, AdminEmailDraftInput } from "@/lib/admin-v2/email-drafts-store";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";

const empty: AdminEmailDraftInput = { toAddress: "", subject: "", bodyText: "" };

export function AdminV2EmailDraftWorkspace({
  initial,
  canManage,
}: {
  initial: AdminEmailDraft[] | null;
  canManage: boolean;
}) {
  const [drafts, setDrafts] = useState<AdminEmailDraft[]>(initial ?? []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminEmailDraftInput>(empty);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [problem, setProblem] = useState("");
  const active = drafts.find((draft) => draft.id === activeId) ?? null;

  function select(draft: AdminEmailDraft | null) {
    setActiveId(draft?.id ?? null);
    setForm(draft ? { toAddress: draft.toAddress, subject: draft.subject, bodyText: draft.bodyText } : empty);
    setMessage("");
    setProblem("");
  }

  async function saveDraft() {
    if (!canManage || initial === null || saving) return;
    setSaving(true);
    setProblem("");
    setMessage("");
    try {
      const response = await fetch(active
        ? `/api/admin-v2/email-drafts/${encodeURIComponent(active.id)}`
        : "/api/admin-v2/email-drafts", {
        method: active ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(active ? { ...form, revision: active.revision } : form),
      });
      const data = await response.json().catch(() => null) as {
        draft?: AdminEmailDraft;
        errors?: string[];
      } | null;
      if (!response.ok || !data?.draft) {
        throw new Error(data?.errors?.join(" ") ?? "Draft save failed.");
      }
      const saved = data.draft;
      setDrafts((existing) => [saved, ...existing.filter((entry) => entry.id !== saved.id)]);
      setActiveId(saved.id);
      setForm({ toAddress: saved.toAddress, subject: saved.subject, bodyText: saved.bodyText });
      setMessage("Draft saved to the database. No email has been sent.");
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Email draft could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function archiveDraft() {
    if (!active || !canManage || saving || !window.confirm("Archive this draft? It will no longer appear in the active list.")) return;
    setSaving(true);
    setProblem("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin-v2/email-drafts/${encodeURIComponent(active.id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision: active.revision }),
      });
      const data = await response.json().catch(() => null) as { archived?: boolean; errors?: string[] } | null;
      if (!response.ok || data?.archived !== true) {
        throw new Error(data?.errors?.join(" ") ?? "Draft archive failed.");
      }
      setDrafts((existing) => existing.filter((entry) => entry.id !== active.id));
      select(null);
      setMessage("Draft archived. No email has been sent.");
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Draft could not be archived.");
    } finally {
      setSaving(false);
    }
  }

  const changed = !active || form.toAddress !== active.toAddress || form.subject !== active.subject || form.bodyText !== active.bodyText;

  return <>
    <V2PageHeader
      title="Email"
      description="A real, persisted workspace for preparing outbound email drafts. Sending and mailbox synchronization are not connected."
      breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Email" }]}
      actions={<Button variant="outlined" component={Link} href="/admin-v2/integrations">Provider connections</Button>}
    />
    <Stack spacing={2}>
      <Alert severity="info">
        Drafts are saved only. No email is sent, received, queued or marked delivered.
        Connect and verify an approved email provider before adding a Send action or inbox synchronization.
      </Alert>
      {initial === null
        ? <Alert severity="warning">Email draft database is unavailable or has not been migrated. No sample drafts or success states are shown.</Alert>
        : null}
      {!canManage
        ? <Alert severity="info">You have read-only access to draft content. Editing requires email.manage.</Alert>
        : null}
      {problem ? <Alert severity="error">{problem}</Alert> : null}
      {message ? <Alert severity="success">{message}</Alert> : null}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: "flex-start" }}>
        <V2Card>
          <Stack spacing={1.5} sx={{ minWidth: { md: 230 }, width: "100%" }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Saved drafts</Typography>
              <Chip label={initial === null ? "Unavailable" : String(drafts.length)} size="small" variant="outlined" />
            </Stack>
            {canManage ? <Button variant="outlined" onClick={() => select(null)} disabled={saving || initial === null}>New draft</Button> : null}
            <Divider />
            {initial === null ? <Typography variant="body2">Database unavailable</Typography>
              : drafts.length === 0 ? <Typography variant="body2" color="text.secondary">No saved drafts yet.</Typography>
              : drafts.map((draft) => <Button key={draft.id}
                  variant={activeId === draft.id ? "contained" : "text"}
                  color="inherit"
                  onClick={() => select(draft)}
                  sx={{ justifyContent: "flex-start", textTransform: "none", textAlign: "left" }}>
                  <Stack sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{draft.subject || "(No subject)"}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{draft.toAddress || "No recipient"} · v{draft.revision}</Typography>
                  </Stack>
                </Button>)}
          </Stack>
        </V2Card>
        <V2Card>
          <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6">{active ? "Edit saved draft" : "Compose draft"}</Typography>
              <Chip size="small" variant="outlined" label="Draft only" />
            </Stack>
            <TextField label="To (one email address)" fullWidth value={form.toAddress}
              disabled={!canManage || saving || initial === null}
              inputProps={{ maxLength: 254 }}
              onChange={(event) => setForm((previous) => ({ ...previous, toAddress: event.target.value }))}
              helperText="Recipient is optional until ready. No message will be sent." />
            <TextField label="Subject" fullWidth value={form.subject}
              disabled={!canManage || saving || initial === null}
              inputProps={{ maxLength: 200 }}
              onChange={(event) => setForm((previous) => ({ ...previous, subject: event.target.value }))} />
            <TextField label="Plain-text message" multiline minRows={9} fullWidth value={form.bodyText}
              disabled={!canManage || saving || initial === null}
              inputProps={{ maxLength: 20000 }}
              onChange={(event) => setForm((previous) => ({ ...previous, bodyText: event.target.value }))} />
            {active ? <Typography variant="caption" color="text.secondary">
              Revision {active.revision}. Last saved {new Date(active.updatedAt).toLocaleString()}.
              Concurrent edits are rejected rather than overwritten.
            </Typography> : null}
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Button variant="contained" onClick={() => void saveDraft()}
                disabled={!canManage || initial === null || saving || !changed}>{saving ? "Saving..." : "Save draft"}</Button>
              {active && canManage ? <Button variant="outlined" color="error" onClick={() => void archiveDraft()} disabled={saving}>Archive draft</Button> : null}
              <Button disabled variant="outlined">Send unavailable</Button>
            </Stack>
          </Stack>
        </V2Card>
      </Stack>
    </Stack>
  </>;
}
