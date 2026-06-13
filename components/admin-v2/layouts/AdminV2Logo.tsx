"use client";

import { Box, Stack, Typography } from "@mui/material";
import { Sparkles } from "lucide-react";
import { adminV2Brand } from "@/configs/admin-v2/theme";

export function AdminV2Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Stack direction="row" spacing={1.4} sx={{ minWidth: 0, alignItems: "center" }}>
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          color: "white",
          background: `linear-gradient(135deg, ${adminV2Brand.primary}, ${adminV2Brand.accent})`,
          boxShadow: `0 10px 22px ${adminV2Brand.primary}35`,
          flex: "0 0 auto",
        }}
      >
        <Sparkles size={19} />
      </Box>
      {!collapsed ? (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }} noWrap>
            Aevyrixa
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            Her Care Admin
          </Typography>
        </Box>
      ) : null}
    </Stack>
  );
}
