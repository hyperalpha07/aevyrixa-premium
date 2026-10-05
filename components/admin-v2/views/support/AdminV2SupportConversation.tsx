"use client";

import { Box, ButtonBase, Chip, IconButton, Menu, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { BellRing, Copy, LockKeyhole, Mail, MoreHorizontal, Paperclip, ShieldCheck, StickyNote, Tag, UserRound, UserRoundCheck } from "lucide-react";
import type { SupportAttachment } from "@/app/lib/support-attachments";
import { formatSupportAttachmentSize } from "@/app/lib/support-attachment-rules";
import type { ConversationStatus, SupportProductShare } from "@/app/lib/support-store";
import { canReplyToSupport, orderSupportMessages, type SupportDetail } from "@/lib/admin-v2/support/support-query";
import { supportLabel, supportSourceLabel, supportTime } from "@/lib/admin-v2/support/support-format";
import { deriveSupportSlaState } from "@/lib/admin-v2/support/support-sla";
import { AdminV2SupportComposer } from "./AdminV2SupportComposer";

function dateLabel(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Date unavailable";
  const today = new Date();
  const inDhaka = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" });
  const day = inDhaka.format(date);
  if (day === inDhaka.format(today)) return "Today";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" }).format(date);
}

export function AdminV2SupportConversation({ conversation, canReply, canClose, busy, actionError, onReply, onInternalNote, onProductShare, aiEnabled, onStatus, onRefresh, onMarkUnread }: {
  conversation: SupportDetail; canReply: boolean; canClose: boolean; busy: boolean;
  actionError: string;
  onReply: (body: string, files: File[]) => Promise<boolean>; onInternalNote?: (body: string) => Promise<boolean>; onProductShare?: (product: { id: string; slug: string }) => Promise<boolean>; aiEnabled: boolean; onStatus: (status: ConversationStatus) => void;
  onRefresh?: () => void; onMarkUnread?: () => void;
}) {
  const history = useRef<HTMLDivElement>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  let lastDate = "";
  const messages = orderSupportMessages(conversation.messages);
  const thread = orderSupportMessages([
    ...messages.map(message => ({ ...message, kind: "message" as const })),
    ...(conversation.internalNotes ?? []).map(note => ({ ...note, kind: "note" as const })),
  ]);
  const nextStatus = conversation.status === "closed" ? "open" : "closed";

  return <Box sx={{ height: "100%", minHeight: 0, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
    <Stack direction="row" sx={{
      px: 2.1,
      py: 1.25,
      borderBottom: 1,
      borderColor: "rgba(31, 25, 56, 0.08)",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 1.5,
      bgcolor: "rgba(255, 255, 255, 0.94)",
    }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.35, minWidth: 0 }}>
        <Box sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          color: "#fff",
          fontWeight: 950,
          background: "linear-gradient(135deg, #8B5CF6, #C084FC)",
          boxShadow: "0 14px 28px rgba(124,77,255,0.22)",
        }}>CU</Box>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 950, letterSpacing: "-0.02em", whiteSpace: "nowrap", fontSize: 19 }}>
              {supportLabel(conversation.id)}
            </Typography>
            <IconButton size="small" aria-label="Copy conversation ID" onClick={() => { void navigator.clipboard?.writeText(conversation.id); }}
              sx={{ width: 28, height: 28, border: "1px solid rgba(124,77,255,0.14)", color: "#6D5B8E", bgcolor: "rgba(124,77,255,0.045)" }}>
              <Copy size={13} />
            </IconButton>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere", fontWeight: 650 }}>
            {supportSourceLabel(conversation.source_page)} · Created {supportTime(conversation.created_at)}
          </Typography>
        </Box>
      </Stack>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
        {canClose ? <TextField select size="small" value={conversation.status} disabled={busy}
          aria-label="Conversation status"
          onChange={event => onStatus(event.target.value as ConversationStatus)}
          sx={{
            width: 118,
            flexShrink: 0,
            "& .MuiInputBase-root": {
              height: 34,
              borderRadius: 999,
              bgcolor: conversation.status === "open" ? "rgba(46,125,50,0.08)" : conversation.status === "pending" ? "rgba(217,139,18,0.08)" : "rgba(107,114,128,0.08)",
              fontWeight: 900,
              textTransform: "capitalize",
              fontSize: 13,
            },
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(31,25,56,0.12)" },
          }}>
          <MenuItem value="open">Open</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="closed">Closed</MenuItem>
        </TextField> : <Chip label={conversation.status} size="small" sx={{ textTransform: "capitalize" }} />}
        <IconButton aria-label="More support actions" aria-controls={menuAnchor ? "support-actions-menu" : undefined} aria-haspopup="menu"
          disabled={busy} onClick={event => setMenuAnchor(event.currentTarget)}
          sx={{ border: 1, borderColor: "rgba(31,25,56,0.12)", bgcolor: "background.paper", width: 34, height: 34, color: "#4B3F63", "&:hover": { bgcolor: "rgba(124,77,255,0.06)" } }}>
          <MoreHorizontal size={17} />
        </IconButton>
        <Menu id="support-actions-menu" anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
          <MenuItem onClick={() => { void navigator.clipboard?.writeText(conversation.id); setMenuAnchor(null); }}>Copy conversation ID</MenuItem>
          <MenuItem onClick={() => { setMenuAnchor(null); onRefresh?.(); }}>Refresh conversation</MenuItem>
          <MenuItem disabled={!canClose} onClick={() => { setMenuAnchor(null); onMarkUnread?.(); }}>Mark as unread</MenuItem>
          <MenuItem disabled={!canClose} onClick={() => { setMenuAnchor(null); onStatus(nextStatus); }}>{conversation.status === "closed" ? "Reopen conversation" : "Close conversation"}</MenuItem>
        </Menu>
      </Stack>
    </Stack>
    <Box ref={history} role="region" aria-label="Message history" tabIndex={0}
      sx={{ flex: "1 1 0", minHeight: 0, overflowY: "auto", px: 2.8, py: 1.9, background: "linear-gradient(180deg, #F7F5FC 0%, #FBFAFF 58%, #F8F6FD 100%)" }}>
      <Box sx={{ maxWidth: 820, mx: "auto", width: "100%" }}>
        {!thread.length && <Typography color="text.secondary">No messages yet.</Typography>}
        {thread.map(entry => {
          const currentDate = dateLabel(entry.created_at);
          const showDate = currentDate !== lastDate;
          lastDate = currentDate;
          if (entry.kind === "note") {
            return <Box key={entry.id}>
              {showDate && <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, my: 1.45 }}>
                <Box sx={{ flex: 1, height: 1, bgcolor: "rgba(91, 74, 125, 0.12)" }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850, letterSpacing: 0.25 }}>{currentDate}</Typography>
                <Box sx={{ flex: 1, height: 1, bgcolor: "rgba(91, 74, 125, 0.12)" }} />
              </Stack>}
              <Box sx={{ maxWidth: "76%", mx: "auto", mb: 1.35, px: 1.45, py: 1.05, borderRadius: 2.4, bgcolor: "rgba(255,246,217,0.72)", border: "1px solid rgba(217,139,18,0.2)", color: "#5F4212", boxShadow: "0 10px 22px rgba(137,91,18,0.08)" }}>
                <Stack direction="row" sx={{ alignItems: "center", gap: 0.65, mb: 0.45 }}>
                  <LockKeyhole size={14} />
                  <Typography variant="caption" sx={{ fontWeight: 950 }}>Internal note · {entry.author_name || "Admin"} · {supportTime(entry.created_at)}</Typography>
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.55 }}>{entry.body}</Typography>
              </Box>
            </Box>;
          }
          const admin = entry.sender_type === "admin";
          return <Box key={entry.id}>
            {showDate && <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, my: 1.45 }}>
              <Box sx={{ flex: 1, height: 1, bgcolor: "rgba(91, 74, 125, 0.12)" }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850, letterSpacing: 0.25 }}>{currentDate}</Typography>
              <Box sx={{ flex: 1, height: 1, bgcolor: "rgba(91, 74, 125, 0.12)" }} />
            </Stack>}
            <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: admin ? "flex-end" : "flex-start", gap: 1.05, mb: 1.35 }}>
              {!admin && <MessageAvatar admin={false} />}
              <Box sx={{
                maxWidth: "62%",
                minWidth: 140,
                px: 1.75,
                py: 1.3,
                borderRadius: admin ? "20px 20px 7px 20px" : "20px 20px 20px 7px",
                background: admin ? "linear-gradient(135deg, #7C4DFF 0%, #6D5FEA 100%)" : "rgba(255, 255, 255, 0.98)",
                color: admin ? "#fff" : "text.primary",
                border: 1,
                borderColor: admin ? "rgba(103, 70, 244, 0.42)" : "rgba(31, 25, 56, 0.08)",
                boxShadow: admin ? "0 12px 28px rgba(84, 57, 170, 0.2)" : "0 8px 24px rgba(31, 25, 56, 0.07)",
              }}>
                <Typography variant="caption" sx={{ display: "block", mb: 0.5, opacity: admin ? 0.86 : 0.62, fontWeight: 900 }}>
                  {admin ? "Owner" : "Customer"} · {supportTime(entry.created_at)}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.6, fontWeight: 560 }}>{entry.body}</Typography>
                <MessageProductShares shares={entry.product_shares ?? []} admin={admin} />
                <MessageAttachments attachments={entry.attachments ?? []} admin={admin} />
              </Box>
              {admin && <MessageAvatar admin />}
            </Box>
          </Box>;
        })}
      </Box>
    </Box>
    {canReplyToSupport(canReply, conversation.status) ? <AdminV2SupportComposer key={conversation.id} busy={busy} error={actionError} onReply={onReply} onProductShare={onProductShare} onInternalNote={onInternalNote} aiEnabled={aiEnabled} messages={conversation.messages} /> :
      <Box sx={{ px: 2.5, py: 2, borderTop: 1, borderColor: "rgba(31, 25, 56, 0.08)", bgcolor: "rgba(248, 247, 252, 0.9)" }}>
        {actionError && <Typography color="error" sx={{ mb: 1, fontWeight: 700 }}>{actionError}</Typography>}
        <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
          {conversation.status === "closed" ? "Conversation closed" : "Read-only access. You do not have permission to reply."}
        </Typography>
      </Box>}
  </Box>;
}

export function AdminV2SupportContextPanel({ conversation, canClose, canManage, busy, onStatus, onAssign, onPriority, onEscalate, onClearEscalation, onAttachLabel, onRemoveLabel, onCreateLabel, onUpdateLabel, onDeleteLabel }: {
  conversation: SupportDetail;
  canClose: boolean;
  canManage: boolean;
  busy: boolean;
  onStatus: (status: ConversationStatus) => void;
  onAssign: (staffId: string | null, staffName: string | null) => void;
  onPriority: (priority: "low" | "normal" | "high" | "urgent") => void;
  onEscalate: (reason: string, staffId: string | null) => void;
  onClearEscalation: () => void;
  onAttachLabel: (labelId: string) => void;
  onRemoveLabel: (labelId: string) => void;
  onCreateLabel: (labelName: string) => void;
  onUpdateLabel: (labelId: string, name: string, color: string | null) => void;
  onDeleteLabel: (labelId: string) => void;
}) {
  const messages = orderSupportMessages(conversation.messages);
  const firstMessage = messages[0];
  const lastMessage = messages.at(-1);
  const customerMessages = messages.filter(message => message.sender_type === "customer").length;
  const adminMessages = messages.filter(message => message.sender_type === "admin").length;
  const attachmentCount = messages.reduce((count, message) => count + (message.attachments?.length ?? 0), 0);
  const nextStatus = conversation.status === "closed" ? "open" : "closed";
  const [assignAnchor, setAssignAnchor] = useState<HTMLElement | null>(null);
  const [labelAnchor, setLabelAnchor] = useState<HTMLElement | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const labels = conversation.labels ?? [];
  const availableLabels = conversation.availableLabels ?? [];
  const staff = conversation.staff ?? [];
  const attachedIds = new Set(labels.map(label => label.id));
  const unassigned = !conversation.assigned_staff_name;
  const sla = deriveSupportSlaState({
    priority: conversation.priority ?? "normal",
    slaStartedAt: conversation.sla_started_at,
    status: conversation.status,
    messages: conversation.messages,
  });

  return <Box sx={{ minHeight: 0, overflowY: "auto", px: 1.9, py: 1.7 }}>
    <Stack sx={{ gap: 0 }}>
      <ContextSection>
        <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 950, letterSpacing: "-0.01em" }}>Customer</Typography>
          <MoreHorizontal size={17} color="#7A6A9D" />
        </Stack>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1.15, mt: 1.6 }}>
          <Box sx={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: "#6D34D5",
            fontWeight: 950,
            letterSpacing: 0.2,
            background: "linear-gradient(135deg, rgba(124,77,255,0.16), rgba(236,72,153,0.12))",
            border: "1px solid rgba(124,77,255,0.22)",
            boxShadow: "0 14px 28px rgba(80,61,145,0.12)",
          }}>GU</Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 950, lineHeight: 1.15 }}>Guest Customer</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.3, fontWeight: 700 }}>No linked account profile</Typography>
            <Stack direction="row" sx={{ mt: 0.75, gap: 0.65, flexWrap: "wrap" }}>
              <Chip size="small" label="Guest" sx={{ height: 22, fontWeight: 850, color: "#5F3DB9", bgcolor: "rgba(124,77,255,0.09)" }} />
              <Chip size="small" label="Verified source" sx={{ height: 22, fontWeight: 850, color: "#0F8A5F", bgcolor: "rgba(32,166,106,0.1)" }} />
            </Stack>
          </Box>
        </Stack>
        <Stack direction="row" sx={{ mt: 1.7, gap: 0.8 }}>
          <MetricTile value="—" label="Orders" />
          <MetricTile value="—" label="Total Spend" />
          <MetricTile value={messages.length} label="Messages" />
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.1, lineHeight: 1.45 }}>
          Customer identity is not captured for this conversation, so account, location, and order totals are intentionally not inferred.
        </Typography>
      </ContextSection>

      <ContextSection>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Recent orders</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Real data only</Typography>
        </Stack>
        <Box sx={{ mt: 1.25, p: 1.25, borderRadius: 2.25, bgcolor: "rgba(124,77,255,0.045)", border: "1px dashed rgba(124,77,255,0.18)" }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>No linked customer orders</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.35, lineHeight: 1.45 }}>
            This guest chat is not connected to an account or order record.
          </Typography>
        </Box>
      </ContextSection>

      <ContextSection>
        <Typography variant="subtitle2" sx={{ fontWeight: 950, mb: 1.15 }}>Conversation info</Typography>
        <InfoRow label="Source" value={supportSourceLabel(conversation.source_page)} />
        <InfoRow label="First message" value={firstMessage ? supportTime(firstMessage.created_at) : "Unavailable"} />
        <InfoRow label="Last message" value={lastMessage ? supportTime(lastMessage.created_at) : "Unavailable"} />
        <InfoRow label="Total messages" value={String(messages.length)} />
        <InfoRow label="Customer messages" value={String(customerMessages)} />
        <InfoRow label="Admin replies" value={String(adminMessages)} />
        <InfoRow label="Attachments" value={String(attachmentCount)} />
        <InfoRow label="Status" value={conversation.status[0].toUpperCase() + conversation.status.slice(1)} />
        <InfoRow label="Priority" value={(conversation.priority ?? "normal").toUpperCase()} />
        <InfoRow label="SLA" value={sla.label} />
        <InfoRow label="Assigned To" value={conversation.assigned_staff_name || "Unassigned"} />
        <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 5.8rem) minmax(0, 1fr)", gap: 1.25, py: 0.55, alignItems: "start" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Labels</Typography>
          <Stack direction="row" sx={{ justifyContent: "flex-end", gap: 0.55, flexWrap: "wrap" }}>
            {labels.length ? labels.map(label => <Chip key={label.id} size="small" label={label.name}
              onDelete={canManage && !busy ? () => onRemoveLabel(label.id) : undefined}
              sx={{ height: 22, fontWeight: 850, color: "#5F3DB9", bgcolor: "rgba(124,77,255,0.08)", border: "1px solid rgba(124,77,255,0.16)" }} />) :
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>None</Typography>}
          </Stack>
        </Box>
      </ContextSection>

      <ContextSection>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Priority & SLA</Typography>
          <Chip size="small" label={sla.tracked ? sla.label : "SLA not tracked"} color={sla.resolutionBreached || sla.firstResponseBreached ? "error" : "default"} />
        </Stack>
        <TextField select size="small" fullWidth value={conversation.priority ?? "normal"} disabled={!canManage || busy}
          aria-label="Support priority" onChange={event => onPriority(event.target.value as "low" | "normal" | "high" | "urgent")} sx={{ mt: 1.2 }}>
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="normal">Normal</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="urgent">Urgent</MenuItem>
        </TextField>
        <InfoRow label="First response" value={sla.firstResponseDeadline ? supportTime(sla.firstResponseDeadline) : "SLA not tracked"} />
        <InfoRow label="Resolution" value={sla.resolutionDeadline ? supportTime(sla.resolutionDeadline) : "SLA not tracked"} />
      </ContextSection>

      <ContextSection>
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.8 }}>
          <BellRing size={16} color="#7C3AED" />
          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Escalation</Typography>
        </Stack>
        {conversation.escalated_at ? <Box sx={{ mt: 1 }}>
          <InfoRow label="Escalated" value={supportTime(conversation.escalated_at)} />
          <InfoRow label="By" value={conversation.escalated_by || "Admin"} />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.7, lineHeight: 1.45 }}>{conversation.escalation_reason}</Typography>
          {canManage && <V2ContextButton disabled={busy} onClick={onClearEscalation}>Clear escalation</V2ContextButton>}
        </Box> : <Box sx={{ mt: 1 }}>
          <TextField size="small" fullWidth placeholder="Reason required" disabled={!canManage || busy} value={escalationReason} onChange={event => setEscalationReason(event.target.value)} />
          {canManage && <V2ContextButton disabled={busy || !escalationReason.trim()} onClick={() => { onEscalate(escalationReason, null); setEscalationReason(""); }}>Escalate conversation</V2ContextButton>}
        </Box>}
      </ContextSection>

      <ContextSection>
        <Stack direction="row" sx={{ gap: 0.9, alignItems: "center" }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 2, display: "grid", placeItems: "center", color: "#6D34D5", bgcolor: "rgba(124,77,255,0.09)" }}>
            <Mail size={16} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Workflow note</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>Reply, attachments, refresh, unread, and status changes are wired to real Support APIs.</Typography>
          </Box>
        </Stack>
      </ContextSection>

      <Box sx={{ display: "grid", gridTemplateColumns: canClose ? "1fr 1fr 1fr" : "1fr", gap: 0.8, pt: 1.5 }}>
        {canManage && <ButtonBase disabled={busy} onClick={event => setAssignAnchor(event.currentTarget)}
          sx={{
            justifyContent: "center",
            gap: 0.6,
            px: 0.8,
            py: 1,
            borderRadius: 2,
            border: "1px solid rgba(49,130,206,0.18)",
            color: "#245B8F",
            bgcolor: unassigned ? "rgba(49,130,206,0.055)" : "rgba(32,166,106,0.08)",
            fontWeight: 950,
            fontSize: 12.5,
            "&:hover": { bgcolor: "rgba(49,130,206,0.1)" },
          }}>
          <UserRoundCheck size={15} />
          Assign
        </ButtonBase>}
        <Menu anchorEl={assignAnchor} open={Boolean(assignAnchor)} onClose={() => setAssignAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "left" }} transformOrigin={{ vertical: "bottom", horizontal: "left" }}>
          <MenuItem selected={unassigned} onClick={() => { onAssign(null, null); setAssignAnchor(null); }}>Unassigned</MenuItem>
          {staff.map(member => <MenuItem key={member.id} selected={conversation.assigned_staff_id === member.id}
            onClick={() => { onAssign(member.id, member.name); setAssignAnchor(null); }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 850 }}>{member.name}</Typography>
              <Typography variant="caption" color="text.secondary">{member.email || member.role || "Active staff"}</Typography>
            </Box>
          </MenuItem>)}
          {!staff.length && <MenuItem disabled>No active staff available</MenuItem>}
        </Menu>
        <ButtonBase onClick={() => window.dispatchEvent(new Event("noromi-support:add-note"))}
          sx={{
            justifyContent: "center",
            gap: 0.7,
            px: 1,
            py: 1,
            borderRadius: 2,
            border: "1px solid rgba(124,77,255,0.2)",
            color: "#5F3DB9",
            bgcolor: "rgba(124,77,255,0.055)",
            fontWeight: 950,
            fontSize: 13,
            "&:hover": { bgcolor: "rgba(124,77,255,0.1)" },
          }}>
          <StickyNote size={15} />
          Add Note
        </ButtonBase>
        {canClose && <ButtonBase disabled={busy} onClick={() => onStatus(nextStatus)}
          sx={{
            justifyContent: "center",
            px: 1,
            py: 1,
            borderRadius: 2,
            border: "1px solid rgba(236,72,153,0.25)",
            color: conversation.status === "closed" ? "#5F3DB9" : "#A8324E",
            bgcolor: conversation.status === "closed" ? "rgba(124,77,255,0.055)" : "rgba(236,72,153,0.065)",
            fontWeight: 950,
            fontSize: 13,
            "&:hover": { bgcolor: conversation.status === "closed" ? "rgba(124,77,255,0.1)" : "rgba(236,72,153,0.1)" },
          }}>
          {conversation.status === "closed" ? "Reopen" : "Close"}
        </ButtonBase>}
      </Box>
      {canManage && <Box sx={{ display: "grid", gridTemplateColumns: "1fr", pt: 0.8 }}>
        <ButtonBase disabled={busy} onClick={event => setLabelAnchor(event.currentTarget)}
          sx={{ justifyContent: "center", gap: 0.65, px: 1, py: 0.9, borderRadius: 2, border: "1px solid rgba(124,77,255,0.18)", color: "#5F3DB9", bgcolor: "rgba(124,77,255,0.045)", fontWeight: 950, fontSize: 13, "&:hover": { bgcolor: "rgba(124,77,255,0.09)" } }}>
          <Tag size={15} />
          Add Label
        </ButtonBase>
        <Menu anchorEl={labelAnchor} open={Boolean(labelAnchor)} onClose={() => setLabelAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "left" }} transformOrigin={{ vertical: "bottom", horizontal: "left" }}
          slotProps={{ paper: { sx: { width: 280, p: 0.75 } } }}>
          <Box sx={{ px: 1, py: 0.75 }}>
            <TextField size="small" fullWidth placeholder="Create label" value={newLabel} onChange={event => setNewLabel(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const value = newLabel.trim();
                  if (value) {
                    onCreateLabel(value);
                    setNewLabel("");
                    setLabelAnchor(null);
                  }
                }
              }} />
          </Box>
          {availableLabels.map(label => {
            const attached = attachedIds.has(label.id);
            return <MenuItem key={label.id} selected={attached}
              onClick={() => { attached ? onRemoveLabel(label.id) : onAttachLabel(label.id); setLabelAnchor(null); }}>
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1, width: "100%" }}>
                <Typography variant="body2" sx={{ fontWeight: 850 }}>{label.name}</Typography>
                <Stack direction="row" sx={{ gap: 0.75 }}>
                  <Typography variant="caption" color="text.secondary">{attached ? "Remove" : "Add"}</Typography>
                  <Typography variant="caption" color="text.secondary" onClick={(event) => { event.stopPropagation(); const name = window.prompt("Rename label", label.name); if (name?.trim()) onUpdateLabel(label.id, name, label.color); }}>Edit</Typography>
                  <Typography variant="caption" color="error" onClick={(event) => { event.stopPropagation(); if (window.confirm(`Delete label "${label.name}" everywhere?`)) onDeleteLabel(label.id); }}>Delete</Typography>
                </Stack>
              </Stack>
            </MenuItem>;
          })}
          {!availableLabels.length && <MenuItem disabled>No labels yet. Type a new label and press Enter.</MenuItem>}
        </Menu>
      </Box>}
    </Stack>
  </Box>;
}

function ContextSection({ children }: { children: ReactNode }) {
  return <Box sx={{
    py: 1.65,
    borderBottom: "1px solid rgba(31,25,56,0.08)",
    "&:last-of-type": { borderBottom: 0, pb: 0 },
  }}>{children}</Box>;
}

function MetricTile({ value, label }: { value: string | number; label: string }) {
  return <Box sx={{ flex: 1, minWidth: 0, textAlign: "center", p: 0.9, borderRadius: 2, borderRight: "1px solid rgba(31,25,56,0.08)", "&:last-of-type": { borderRight: 0 } }}>
    <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>{value}</Typography>
    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.2, fontWeight: 750 }}>{label}</Typography>
  </Box>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1.25, py: 0.45 }}>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{label}</Typography>
    <Typography variant="caption" sx={{ fontWeight: 850, textAlign: "right", overflowWrap: "anywhere" }}>{value}</Typography>
  </Stack>;
}

function V2ContextButton({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return <ButtonBase disabled={disabled} onClick={onClick}
    sx={{ mt: 1, width: "100%", justifyContent: "center", px: 1, py: 0.85, borderRadius: 2, border: "1px solid rgba(124,77,255,0.18)", color: "#5F3DB9", bgcolor: "rgba(124,77,255,0.045)", fontWeight: 950, fontSize: 13, "&:hover": { bgcolor: "rgba(124,77,255,0.09)" }, "&.Mui-disabled": { opacity: 0.48 } }}>
    {children}
  </ButtonBase>;
}

function MessageAvatar({ admin }: { admin: boolean }) {
  return <Box sx={{
    width: 31,
    height: 31,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    color: admin ? "#fff" : "#6D5B8E",
    background: admin ? "linear-gradient(135deg, #7C4DFF, #B15CFF)" : "rgba(255,255,255,0.95)",
    border: admin ? "1px solid rgba(255,255,255,0.32)" : "1px solid rgba(124,77,255,0.16)",
    boxShadow: "0 8px 18px rgba(31,25,56,0.1)",
  }} aria-hidden>
    {admin ? <ShieldCheck size={15} /> : <UserRound size={15} />}
  </Box>;
}

function MessageAttachments({ attachments, admin }: { attachments: SupportAttachment[]; admin: boolean }) {
  if (!attachments.length) return null;
  return <Stack sx={{ mt: 1, gap: 0.75 }}>
    {attachments.map(attachment => {
      const isImage = attachment.mime_type.startsWith("image/");
      const href = attachment.signed_url || "#";
      return <ButtonBase key={attachment.id} component="a" href={href} target="_blank" rel="noreferrer"
        disabled={!attachment.signed_url}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 1,
          p: 0.75,
          borderRadius: 1.5,
          border: 1,
          borderColor: admin ? "rgba(255,255,255,0.22)" : "rgba(124,77,255,0.18)",
          bgcolor: admin ? "rgba(255,255,255,0.12)" : "rgba(124,77,255,0.06)",
          textAlign: "left",
          color: "inherit",
          textDecoration: "none",
        }}>
        {isImage && attachment.signed_url ? <Box component="img" src={attachment.signed_url} alt="" sx={{ width: 44, height: 44, borderRadius: 1.25, objectFit: "cover", flexShrink: 0 }} /> :
          <Box aria-hidden sx={{ width: 44, height: 44, borderRadius: 1.25, display: "grid", placeItems: "center", flexShrink: 0, bgcolor: admin ? "rgba(255,255,255,0.16)" : "rgba(124,77,255,0.1)", fontWeight: 900 }}><Paperclip size={17} /></Box>}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ display: "block", fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachment.file_name}</Typography>
          <Typography variant="caption" sx={{ display: "block", opacity: admin ? 0.76 : 0.62 }}>{formatSupportAttachmentSize(attachment.size_bytes)}</Typography>
        </Box>
      </ButtonBase>;
    })}
  </Stack>;
}

function MessageProductShares({ shares, admin }: { shares: SupportProductShare[]; admin: boolean }) {
  if (!shares.length) return null;
  return <Stack sx={{ mt: 1, gap: 0.8 }}>
    {shares.map(share => {
      const href = `/product/${encodeURIComponent(share.product_slug)}`;
      const price = typeof share.price === "number" ? `${share.currency || "BDT"} ${share.price}` : "Price unavailable";
      const stock = share.stock_status ? share.stock_status.replace(/_/g, " ") : "Availability unknown";
      return <ButtonBase key={share.id} component="a" href={href} target="_blank" rel="noreferrer"
        sx={{
          display: "grid",
          gridTemplateColumns: "54px minmax(0, 1fr)",
          gap: 1,
          p: 0.85,
          borderRadius: 1.7,
          border: 1,
          borderColor: admin ? "rgba(255,255,255,0.24)" : "rgba(124,77,255,0.18)",
          bgcolor: admin ? "rgba(255,255,255,0.13)" : "rgba(124,77,255,0.055)",
          color: "inherit",
          textAlign: "left",
          textDecoration: "none",
        }}>
        <Box sx={{ width: 54, height: 54, borderRadius: 1.4, overflow: "hidden", bgcolor: admin ? "rgba(255,255,255,0.14)" : "rgba(124,77,255,0.09)", display: "grid", placeItems: "center" }}>
          {share.image_url ? <Box component="img" src={share.image_url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Paperclip size={16} />}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ display: "block", fontWeight: 950, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{share.title}</Typography>
          <Typography variant="caption" sx={{ display: "block", opacity: admin ? 0.82 : 0.68, textTransform: "capitalize" }}>{price} · {stock}</Typography>
          <Typography variant="caption" sx={{ display: "block", mt: 0.35, fontWeight: 950, color: admin ? "#fff" : "#5F3DB9" }}>View Product</Typography>
        </Box>
      </ButtonBase>;
    })}
  </Stack>;
}
