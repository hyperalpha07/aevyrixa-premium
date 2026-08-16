"use client";

import { Box, Stack, Typography } from "@mui/material";
import Image from "next/image";
import { brandName, noromiAssets } from "@/configs/brand/noromi";

export function AdminV2Logo({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <Box sx={{ width: 38, height: 38, flex: "0 0 auto" }}>
        <Image
          src={noromiAssets.logoMark}
          alt={`${brandName} Admin`}
          width={38}
          height={38}
          sizes="38px"
          loading="eager"
          unoptimized
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>
    );
  }

  return (
    <Stack direction="row" spacing={1} sx={{ minWidth: 0, alignItems: "center" }}>
      <Box
        sx={{
          position: "relative",
          width: 170,
          height: 58,
          overflow: "hidden",
          flex: "0 0 auto",
        }}
      >
        <Image
          src={noromiAssets.logoHorizontal}
          alt={brandName}
          width={170}
          height={113}
          sizes="170px"
          loading="eager"
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            width: "170px",
            height: "113px",
            objectFit: "contain",
            transform: "translateY(-50%)",
          }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" noWrap sx={{ fontWeight: 700 }}>
        Admin
      </Typography>
    </Stack>
  );
}
