"use client";

import { Box, Chip, List, ListItemButton, Stack, Typography } from "@mui/material";
import type { SupportInboxItem } from "@/lib/admin-v2/support/support-query";
import { supportLabel, supportTime } from "@/lib/admin-v2/support/support-format";

export function AdminV2SupportInbox({ items, selected, disabled, onSelect }: {
  items: SupportInboxItem[]; selected: string; disabled: boolean; onSelect: (id: string) => void;
}) {
  return <List aria-label="Support conversations" disablePadding sx={{ overflowY: "auto", maxHeight: 640 }}>
    {items.map(item => <ListItemButton key={item.id} selected={selected === item.id} disabled={disabled}
      onClick={() => onSelect(item.id)} aria-current={selected === item.id ? "true" : undefined}
      sx={{ display: "block", p: 2.25, borderBottom: 1, borderColor: "divider", borderLeft: "3px solid", borderLeftColor: selected === item.id ? "primary.main" : "transparent" }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, mb: 0.75 }}>
        <Typography variant="subtitle2">{supportLabel(item.id)}</Typography>
        <Chip size="small" label={item.status} color={item.status === "open" ? "success" : item.status === "pending" ? "warning" : "default"} />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflowWrap: "anywhere" }}>Source: {item.source_page || "Not provided"}</Typography>
      <Typography variant="body2" sx={{ my: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere" }}>
        {item.last_message ? `${item.last_message.sender_type === "admin" ? "Admin" : "Customer"}: ${item.last_message.body}` : "No messages yet."}
      </Typography>
      <Box sx={{ display: "flex", gap: 1, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="caption" color="text.secondary">{supportTime(item.last_message?.created_at ?? item.created_at)} · {item.message_count} messages</Typography>
        {item.unread_customer_count > 0 && <Chip size="small" color="primary" label={`${item.unread_customer_count} unread`} />}
      </Box>
    </ListItemButton>)}
  </List>;
}
