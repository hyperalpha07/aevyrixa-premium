"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Typography,
} from "@mui/material";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import type { ReturnCase } from "@/lib/admin-v2/returns/returns-store";
import { returnHygieneStates, returnStates, type ReturnState, type HygieneState } from "@/lib/admin-v2/returns/returns-validation";

type ReturnPageData = { available: boolean; rows: ReturnCase[]; totalCount: number; page: number };
type NextStep = ReturnState;

const actionLabels = { exchange: "Exchange review", refund_review: "Refund review", support: "Support review" };
const hygieneLabels = {
  not_checked: "Not assessed", eligible: "Eligible", ineligible: "Not eligible", exception_review: "Exception reviewed",
};
const stateLabels = { requested: "Requested", reviewing: "Reviewing", approved: "Approved", rejected: "Rejected", closed: "Closed" };
const transitions: Record<ReturnState, NextStep[]> = {
  requested: ["reviewing"], reviewing: ["approved", "rejected"], approved: ["closed"], rejected: ["closed"], closed: [],
};

async function send(path: string, method: "POST" | "PATCH", payload: unknown) {
  const response = await fetch(path, {
    method, headers: { "content-type": "application/json" }, cache: "no-store", body: JSON.stringify(payload),
  });
  const value = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(value.errors) ? value.errors.join(" ") : "Return operation failed.");
}

export function AdminV2ReturnsView({
  data, canManage, filter,
}: { data: ReturnPageData; canManage: boolean; filter: string }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<ReturnCase | null>(null);
  const [orderRef, setOrderRef] = useState("");
  const [requestedAction, setRequestedAction] = useState<ReturnCase["requested_action"]>("exchange");
  const [reason, setReason] = useState("");
  const [nextState, setNextState] = useState<NextStep>("reviewing");
  const [hygiene, setHygiene] = useState<HygieneState>("not_checked");
  const [reviewNote, setReviewNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function move(nextFilter: string, nextPage = 1) {
    const params = new URLSearchParams({ page: String(nextPage) });
    if (nextFilter !== "all") params.set("status", nextFilter);
    router.push(`/admin-v2/returns?${params}`);
  }
  function openReview(item: ReturnCase) {
    setSelected(item);
    setNextState(transitions[item.status][0] ?? item.status);
    setHygiene(item.hygiene_review);
    setReviewNote("");
    setMessage(null);
  }
  async function createCase() {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await send("/api/admin-v2/returns", "POST", { orderRef, requestedAction, reason });
      setCreateOpen(false);
      setOrderRef(""); setReason("");
      setMessage({ type: "success", text: "Return case created. Confirm hygiene eligibility before approval." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to create return case." });
    } finally { setBusy(false); }
  }
  async function updateCase() {
    if (!selected || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await send(`/api/admin-v2/returns/${encodeURIComponent(selected.id)}`, "PATCH", {
        version: selected.version, fromStatus: selected.status, toStatus: nextState, hygiene, note: reviewNote,
      });
      setSelected(null);
      setMessage({ type: "success", text: "Return case reviewed and history recorded. This does not post a refund." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to update case." });
    } finally { setBusy(false); }
  }

  return (
    <>
      <V2PageHeader title="Returns & Exchanges"
        description="Track real customer return reviews, hygiene eligibility, approvals and resolution without inventing refunds."
        breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Returns" }]}
        actions={canManage ? <Button variant="contained" onClick={() => { setMessage(null); setCreateOpen(true); }}>New return case</Button> : undefined} />
      <Stack spacing={2}>
        {!data.available ? <Alert severity="error">Return case storage is unavailable. No sample returns are being displayed.</Alert> : null}
        <Alert severity="info">Only delivered LIVE orders are eligible for a new case. Hygiene-safe 3-day support is reviewed manually because a reliable delivery-completion timestamp is not yet stored for every order. Approval does not refund money. Use the separate Refunds ledger for recorded payments.</Alert>
        {message ? <Alert severity={message.type} onClose={() => setMessage(null)}>{message.text}</Alert> : null}
        <V2Card>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
              <Typography variant="h6">Return cases · {data.available ? data.totalCount : "Unavailable"}</Typography>
              <TextField size="small" select label="Status" value={filter}
                onChange={(event) => move(event.target.value)} sx={{ minWidth: 180 }}>
                <MenuItem value="all">All statuses</MenuItem>
                {returnStates.map((state) => <MenuItem key={state} value={state}>{stateLabels[state]}</MenuItem>)}
              </TextField>
            </Stack>
            {data.available ? <TableContainer>
              <Table size="small" aria-label="Real return cases">
                <TableHead>
                  <TableRow><TableCell>Order</TableCell><TableCell>Request</TableCell><TableCell>Hygiene</TableCell>
                    <TableCell>Status</TableCell><TableCell>Created</TableCell><TableCell align="right">Action</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {data.rows.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Button component={Link} href={`/admin-v2/orders/${encodeURIComponent(item.order_ref)}`} size="small">{item.order_ref}</Button>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{item.reason}</Typography>
                      </TableCell>
                      <TableCell>{actionLabels[item.requested_action]}</TableCell>
                      <TableCell>{hygieneLabels[item.hygiene_review]}</TableCell>
                      <TableCell><Chip size="small" label={stateLabels[item.status]}
                        color={item.status === "approved" ? "success" : item.status === "rejected" ? "error" : "default"} /></TableCell>
                      <TableCell>{new Date(item.created_at).toLocaleDateString("en-GB")}</TableCell>
                      <TableCell align="right">
                        {canManage && transitions[item.status].length > 0 ? <Button size="small" onClick={() => openReview(item)}>Review</Button> :
                          <Typography variant="caption" color="text.secondary">History retained</Typography>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.rows.length === 0 ? <TableRow><TableCell colSpan={6}>No cases found. Historical TEST orders are excluded.</TableCell></TableRow> : null}
                </TableBody>
              </Table>
            </TableContainer> : null}
            {data.available && data.totalCount > 25 ? (
              <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", alignItems: "center" }}>
                <Button disabled={data.page <= 1} onClick={() => move(filter, data.page-1)}>Previous</Button>
                <Typography variant="body2">Page {data.page} / {Math.ceil(data.totalCount / 25)}</Typography>
                <Button disabled={data.page >= Math.ceil(data.totalCount/25)} onClick={() => move(filter, data.page+1)}>Next</Button>
              </Stack>
            ) : null}
          </Stack>
        </V2Card>
      </Stack>

      <Dialog open={createOpen} onClose={() => { if (!busy) setCreateOpen(false); }} fullWidth maxWidth="sm">
        <DialogTitle>Register a return or exchange review</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Delivered LIVE order reference" value={orderRef} onChange={(event) => setOrderRef(event.target.value)} size="small" required />
            <TextField select label="Requested action" size="small" value={requestedAction}
              onChange={(event) => setRequestedAction(event.target.value as ReturnCase["requested_action"])}>
              {Object.entries(actionLabels).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
            </TextField>
            <TextField multiline minRows={3} label="Reason and condition details" size="small" value={reason} onChange={(event) => setReason(event.target.value)} />
            <Alert severity="warning">Only one case per order can be registered in this initial workflow. Verify delivery and hygiene conditions before recording a request.</Alert>
          </Stack>
        </DialogContent>
        <DialogActions><Button disabled={busy} onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={busy || orderRef.trim().length < 4 || reason.trim().length < 10} onClick={() => void createCase()}>Create case</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(selected)} onClose={() => { if (!busy) setSelected(null); }} fullWidth maxWidth="sm">
        <DialogTitle>Review case · {selected?.order_ref}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2">{selected?.reason}</Typography>
          <TextField select size="small" label="Next status" value={nextState}
            onChange={(event) => setNextState(event.target.value as NextStep)}>
            {(selected ? transitions[selected.status] : []).map((state) =>
              <MenuItem key={state} value={state}>{stateLabels[state]}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Hygiene eligibility review" value={hygiene}
            onChange={(event) => setHygiene(event.target.value as HygieneState)}>
            {returnHygieneStates.map((state) => <MenuItem key={state} value={state}>{hygieneLabels[state]}</MenuItem>)}
          </TextField>
          <TextField size="small" multiline minRows={3} label="Review note (required)" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} />
          <Alert severity="info">A recorded review is an operational decision, not a payment, invoice change, or automatic refund.</Alert>
        </Stack></DialogContent>
        <DialogActions><Button disabled={busy} onClick={() => setSelected(null)}>Cancel</Button>
          <Button variant="contained" disabled={busy || reviewNote.trim().length < 8 ||
            (nextState === "approved" && !["eligible","exception_review"].includes(hygiene))}
            onClick={() => void updateCase()}>Save review</Button></DialogActions>
      </Dialog>
    </>
  );
}
