import { Skeleton, Stack } from "@mui/material";

export function V2Skeleton() {
  return (
    <Stack spacing={1.5}>
      <Skeleton variant="rounded" height={42} />
      <Skeleton variant="rounded" height={120} />
      <Skeleton variant="rounded" height={120} />
    </Stack>
  );
}
