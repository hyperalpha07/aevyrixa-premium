"use client";

import { Box, Typography } from "@mui/material";
import { brandName } from "@/configs/brand/noromi";

export function AdminV2Footer() {
  return (
    <Box component="footer" sx={{ py: 3, textAlign: "center" }}>
      <Typography variant="caption" color="text.secondary">
        {brandName} Admin
      </Typography>
    </Box>
  );
}
