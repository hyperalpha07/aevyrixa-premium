import { Box, LinearProgress } from "@mui/material";

export default function Loading() {
  return (
    <Box aria-label="Loading invoice" sx={{ width: "100%", pt: 0.5 }}>
      <LinearProgress sx={{ height: 2, borderRadius: 999 }} />
    </Box>
  );
}
