"use client";

import { Box, Chip, List, ListItemButton, Stack, Typography } from "@mui/material";
import type { SupportInboxItem } from "@/lib/admin-v2/support/support-query";
import { supportLabel, supportTime } from "@/lib/admin-v2/support/support-format";

function statusColor(status: SupportInboxItem["status"]) {
  if (status === "open") return "success.main";
  if (status === "pending") return "warning.main";
  return "text.disabled";
}

export function AdminV2SupportInbox({ items, selected, disabled, onSelect }: {
  items: SupportInboxItem[]; selected: string; disabled: boolean; onSelect: (id: string) => void;
}) {
  return <List aria-label="Support conversations" disablePadding sx={{ overflowY: "auto", flex: 1 }}>
    {items.map(item => {
      const active = selected === item.id;
      const unread = item.unread_customer_count > 0;
      return <ListItemButton key={item.id} selected={active} disabled={disabled}
        onClick={() => onSelect(item.id)} aria-current={active ? "true" : undefined}
        sx={{
          display: "block",
          px: 2,
          py: 1.65,
          borderBottom: 1,
          borderColor: "rgba(0, 0, 0, 0.06)",
          borderLeft: "3px solid",
          borderLeftColor: active ? "primary.main" : "transparent",
          bgcolor: active ? "rgba(124, 77, 255, 0.08)" : "transparent",
          "&:hover": { bgcolor: active ? "rgba(124, 77, 255, 0.1)" : "rgba(124, 77, 255, 0.045)" },
          "&.Mui-selected": { bgcolor: "rgba(124, 77, 255, 0.08)" },
        }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.7 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: unread ? 800 : 700, minWidth: 0 }}>{supportLabel(item.id)}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{supportTime(item.last_message?.created_at ?? item.created_at)}</Typography>
        </Stack>
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, mb: 0.75 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: "999px", bgcolor: statusColor(item.status), flexShrink: 0 }} aria-hidden />
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize", fontWeight: 700 }}>{item.status}</Typography>
        </Stack>
        <Typography variant="body2" color={unread ? "text.primary" : "text.secondary"} sx={{ my: 0.8, fontWeight: unread ? 700 : 500, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere" }}>
          {item.last_message ? `${item.last_message.sender_type === "admin" ? "Admin" : "Customer"}: ${item.last_message.body}` : "No messages yet."}
        </Typography>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.source_page || "Source not provided"} - {item.message_count} messages</Typography>
          {unread && <Chip size="small" color="primary" label={item.unread_customer_count} sx={{ height: 22, minWidth: 28, fontWeight: 800 }} />}
        </Stack>
      </ListItemButton>;
    })}
  </List>;
}
