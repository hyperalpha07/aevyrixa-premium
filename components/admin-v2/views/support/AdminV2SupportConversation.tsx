"use client";

import { Box, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import type { ConversationStatus } from "@/app/lib/support-store";
import { canReplyToSupport, orderSupportMessages, type SupportDetail } from "@/lib/admin-v2/support/support-query";
import { supportLabel, supportTime } from "@/lib/admin-v2/support/support-format";
import { AdminV2SupportComposer } from "./AdminV2SupportComposer";

export function AdminV2SupportConversation({ conversation, canReply, canClose, busy, onReply, onStatus }: {
  conversation: SupportDetail; canReply: boolean; canClose: boolean; busy: boolean;
  onReply: (body: string) => Promise<boolean>; onStatus: (status: ConversationStatus) => void;
}) {
  const history = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (history.current) history.current.scrollTop = history.current.scrollHeight;
  }, [conversation.id, conversation.messages.length]);
  return <>
    <Stack direction="row" sx={{ p: 2.5, borderBottom: 1, borderColor: "divider", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6">{supportLabel(conversation.id)}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>Source: {conversation.source_page || "Not provided"}</Typography>
      </Box>
      {canClose ? <TextField select size="small" label="Conversation status" value={conversation.status} disabled={busy}
        onChange={event => onStatus(event.target.value as ConversationStatus)} sx={{ width: 180, flexShrink: 0 }}>
        <MenuItem value="open">Open</MenuItem><MenuItem value="pending">Pending</MenuItem><MenuItem value="closed">Closed</MenuItem>
      </TextField> : <Chip label={conversation.status} size="small" />}
    </Stack>
    <Box ref={history} role="region" aria-label="Message history" tabIndex={0} sx={{ p: 2.5, height: 340, overflowY: "auto" }}>
      {!conversation.messages.length && <Typography color="text.secondary">No messages yet.</Typography>}
      {orderSupportMessages(conversation.messages).map(message => <Box key={message.id} sx={{ display: "flex", justifyContent: message.sender_type === "admin" ? "flex-end" : "flex-start", mb: 2 }}>
        <Box sx={{ maxWidth: "88%", minWidth: 120, p: 1.5, borderRadius: 2, bgcolor: message.sender_type === "admin" ? "primary.main" : "action.hover", color: message.sender_type === "admin" ? "primary.contrastText" : "text.primary" }}>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>{message.sender_type === "admin" ? "Admin" : "Customer"} · {supportTime(message.created_at)}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{message.body}</Typography>
        </Box>
      </Box>)}
    </Box>
    {canReplyToSupport(canReply, conversation.status) ? <AdminV2SupportComposer key={conversation.id} busy={busy} onReply={onReply} /> :
      <Typography sx={{ p: 2.5, borderTop: 1, borderColor: "divider" }} color="text.secondary">
        {conversation.status === "closed" ? "Conversation closed" : "Read-only access. You do not have permission to reply."}
      </Typography>}
  </>;
}
