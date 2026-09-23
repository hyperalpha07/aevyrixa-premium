"use client";

import { Box, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import type { ConversationStatus } from "@/app/lib/support-store";
import { canReplyToSupport, orderSupportMessages, type SupportDetail } from "@/lib/admin-v2/support/support-query";
import { supportLabel, supportTime } from "@/lib/admin-v2/support/support-format";
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

export function AdminV2SupportConversation({ conversation, canReply, canClose, busy, onReply, onStatus }: {
  conversation: SupportDetail; canReply: boolean; canClose: boolean; busy: boolean;
  onReply: (body: string) => Promise<boolean>; onStatus: (status: ConversationStatus) => void;
}) {
  const history = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (history.current) history.current.scrollTop = history.current.scrollHeight;
  }, [conversation.id, conversation.messages.length]);

  let lastDate = "";
  const messages = orderSupportMessages(conversation.messages);

  return <Box sx={{ minHeight: 0, flex: 1, display: "flex", flexDirection: "column" }}>
    <Stack direction="row" sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: "divider", justifyContent: "space-between", alignItems: "center", gap: 2, bgcolor: "rgba(255, 255, 255, 0.72)" }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>{supportLabel(conversation.id)}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{conversation.source_page || "Source not provided"}</Typography>
      </Box>
      {canClose ? <TextField select size="small" label="Status" value={conversation.status} disabled={busy}
        onChange={event => onStatus(event.target.value as ConversationStatus)}
        sx={{
          width: 142,
          flexShrink: 0,
          "& .MuiInputBase-root": { borderRadius: 2, bgcolor: "background.paper" },
          "& .MuiInputLabel-root": { fontSize: 12 },
        }}>
        <MenuItem value="open">Open</MenuItem>
        <MenuItem value="pending">Pending</MenuItem>
        <MenuItem value="closed">Closed</MenuItem>
      </TextField> : <Chip label={conversation.status} size="small" sx={{ textTransform: "capitalize" }} />}
    </Stack>
    <Box ref={history} role="region" aria-label="Message history" tabIndex={0}
      sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 3, py: 2.5, background: "linear-gradient(180deg, rgba(248, 247, 252, 0.52), rgba(255, 255, 255, 0.92))" }}>
      {!messages.length && <Typography color="text.secondary">No messages yet.</Typography>}
      {messages.map(message => {
        const currentDate = dateLabel(message.created_at);
        const showDate = currentDate !== lastDate;
        lastDate = currentDate;
        const admin = message.sender_type === "admin";
        return <Box key={message.id}>
          {showDate && <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, my: 1.5 }}>
            <Box sx={{ flex: 1, height: 1, bgcolor: "divider" }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{currentDate}</Typography>
            <Box sx={{ flex: 1, height: 1, bgcolor: "divider" }} />
          </Stack>}
          <Box sx={{ display: "flex", justifyContent: admin ? "flex-end" : "flex-start", mb: 1.6 }}>
            <Box sx={{
              maxWidth: "68%",
              minWidth: 140,
              px: 1.65,
              py: 1.35,
              borderRadius: admin ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
              bgcolor: admin ? "rgba(109, 76, 255, 0.94)" : "rgba(246, 245, 250, 0.96)",
              color: admin ? "primary.contrastText" : "text.primary",
              border: 1,
              borderColor: admin ? "rgba(109, 76, 255, 0.46)" : "rgba(0, 0, 0, 0.06)",
              boxShadow: admin ? "0 8px 22px rgba(84, 57, 170, 0.18)" : "0 6px 18px rgba(31, 25, 56, 0.06)",
            }}>
              <Typography variant="caption" sx={{ display: "block", mb: 0.45, opacity: admin ? 0.78 : 0.64, fontWeight: 700 }}>
                {admin ? "Admin" : "Customer"} - {supportTime(message.created_at)}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.58 }}>{message.body}</Typography>
            </Box>
          </Box>
        </Box>;
      })}
    </Box>
    {canReplyToSupport(canReply, conversation.status) ? <AdminV2SupportComposer key={conversation.id} busy={busy} onReply={onReply} /> :
      <Box sx={{ px: 2.5, py: 2, borderTop: 1, borderColor: "divider", bgcolor: "rgba(248, 247, 252, 0.8)" }}>
        <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
          {conversation.status === "closed" ? "Conversation closed" : "Read-only access. You do not have permission to reply."}
        </Typography>
      </Box>}
  </Box>;
}
