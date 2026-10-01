"use client";

import { Box, Chip, List, ListItemButton, Stack, Typography } from "@mui/material";
import type { SupportInboxItem } from "@/lib/admin-v2/support/support-query";
import { supportLabel, supportSourceLabel, supportTime } from "@/lib/admin-v2/support/support-format";

function initials(id: string) {
  return supportLabel(id).replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "CU";
}

function statusColor(status: SupportInboxItem["status"]) {
  if (status === "open") return "success.main";
  if (status === "pending") return "warning.main";
  return "text.disabled";
}

export function AdminV2SupportInbox({ items, selected, disabled, onSelect }: {
  items: SupportInboxItem[]; selected: string; disabled: boolean; onSelect: (id: string) => void;
}) {
  return <List aria-label="Support conversations" disablePadding sx={{ overflowY: "auto", flex: 1, p: 0.75 }}>
    {items.map(item => {
      const active = selected === item.id;
      const unread = item.unread_customer_count > 0;
      return <ListItemButton key={item.id} selected={active} disabled={disabled}
        onClick={() => onSelect(item.id)} aria-current={active ? "true" : undefined}
        sx={{
          display: "grid",
          gridTemplateColumns: "44px minmax(0, 1fr) auto",
          gap: 1.2,
          px: 1.15,
          py: 1.25,
          mb: 0.7,
          minHeight: 86,
          borderRadius: 2.75,
          border: "1px solid",
          borderColor: active ? "rgba(124, 77, 255, 0.18)" : "transparent",
          borderLeft: "4px solid",
          borderLeftColor: active ? "primary.main" : "transparent",
          bgcolor: active ? "rgba(124, 77, 255, 0.105)" : "rgba(255,255,255,0.74)",
          boxShadow: active ? "0 14px 28px rgba(80, 61, 145, 0.12)" : "0 1px 0 rgba(31,25,56,0.04)",
          alignItems: "start",
          "&:hover": { bgcolor: active ? "rgba(124, 77, 255, 0.12)" : "rgba(255,255,255,0.94)" },
          "&.Mui-selected": { bgcolor: "rgba(124, 77, 255, 0.105)" },
        }}>
        <Box sx={{
          width: 42,
          height: 42,
          mt: 0.15,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          color: active ? "primary.main" : "#6D5B8E",
          bgcolor: active ? "rgba(124,77,255,0.14)" : "rgba(109,91,142,0.1)",
          border: "1px solid rgba(124,77,255,0.16)",
          fontSize: 12.5,
          fontWeight: 950,
          letterSpacing: 0.2,
        }}>{initials(item.id)}</Box>
        <Box sx={{ minWidth: 0, overflow: "hidden" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: unread ? 950 : 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.2, fontSize: 14 }}>{supportLabel(item.id)}</Typography>
          <Typography variant="body2" color={unread ? "text.primary" : "text.secondary"} sx={{ mt: 0.65, mb: 0.55, fontWeight: unread ? 850 : 550, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.35 }}>
            {item.last_message?.body || "No messages yet."}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 700 }}>{supportSourceLabel(item.source_page)} · {item.message_count} messages</Typography>
        </Box>
        <Stack sx={{ alignItems: "flex-end", gap: 0.7, pt: 0.1, minWidth: 62, maxWidth: 70 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: 11.5, fontWeight: 750, whiteSpace: "nowrap" }}>{supportTime(item.last_message?.created_at ?? item.created_at)}</Typography>
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.55, flexShrink: 0 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: "999px", bgcolor: statusColor(item.status), boxShadow: item.status === "open" ? "0 0 0 3px rgba(46,125,50,0.1)" : "none" }} aria-hidden />
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize", fontWeight: 900 }}>{item.status}</Typography>
          </Stack>
          {unread && <Chip size="small" color="primary" label={item.unread_customer_count} sx={{ height: 22, minWidth: 28, fontWeight: 900 }} />}
        </Stack>
      </ListItemButton>;
    })}
  </List>;
}
