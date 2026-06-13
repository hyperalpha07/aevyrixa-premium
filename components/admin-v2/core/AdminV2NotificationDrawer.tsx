"use client";

import { Box, Drawer, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import { Bell } from "lucide-react";
import type { AdminV2DashboardData } from "@/lib/admin-v2/types";
import { V2EmptyState } from "@/components/admin-v2/shared/V2EmptyState";
import { V2Chip } from "@/components/admin-v2/shared/V2Chip";

type AdminV2NotificationDrawerProps = {
  open: boolean;
  onClose: () => void;
  data?: AdminV2DashboardData;
};

export function AdminV2NotificationDrawer({ open, onClose, data }: AdminV2NotificationDrawerProps) {
  const notifications = [
    data?.orders.available && data.orders.pending > 0
      ? { title: "Pending orders", description: `${data.orders.pending} order(s) need review.`, tone: "warning" as const }
      : null,
    data?.reviews.available && data.reviews.pending > 0
      ? { title: "Pending reviews", description: `${data.reviews.pending} review(s) need moderation.`, tone: "info" as const }
      : null,
    data?.support.available && data.support.open > 0
      ? { title: "Open support conversations", description: `${data.support.open} conversation(s) are open.`, tone: "primary" as const }
      : null,
  ].filter((item): item is { title: string; description: string; tone: "warning" | "info" | "primary" } => Boolean(item));

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: "100vw", sm: 420 }, p: 3 }}>
        <Stack direction="row" sx={{ mb: 2, alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6">Notifications</Typography>
          <V2Chip label={`${notifications.length} active`} color={notifications.length ? "primary" : "default"} />
        </Stack>
        {notifications.length ? (
          <List disablePadding>
            {notifications.map((item) => (
              <ListItem
                key={item.title}
                sx={{ mb: 1, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}
              >
                <ListItemText primary={item.title} secondary={item.description} />
                <V2Chip label="Real" color={item.tone} />
              </ListItem>
            ))}
          </List>
        ) : (
          <V2EmptyState
            icon={Bell}
            title="No active notifications"
            description="No real pending order, review, or support notification is currently available for Admin V2."
          />
        )}
      </Box>
    </Drawer>
  );
}
