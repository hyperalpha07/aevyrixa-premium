import { Box, Grid, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

type V2SkeletonProps = {
  rows?: number;
};

export function V2Skeleton({ rows = 3 }: V2SkeletonProps) {
  return (
    <Stack spacing={1.5}>
      <Skeleton variant="rounded" height={42} />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={120} />
      ))}
    </Stack>
  );
}

export function V2MetricCardSkeleton() {
  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 3, bgcolor: "background.paper" }}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box sx={{ flex: 1 }}>
          <Skeleton width="46%" height={20} />
          <Skeleton width="64%" height={36} />
          <Skeleton width="72%" height={18} />
        </Box>
        <Skeleton variant="rounded" width={42} height={42} />
      </Stack>
    </Box>
  );
}

export function V2TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden", bgcolor: "background.paper" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {Array.from({ length: columns }).map((_, index) => (
              <TableCell key={index}>
                <Skeleton width="70%" />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <TableCell key={columnIndex}>
                  <Skeleton width={columnIndex === 0 ? "60%" : "84%"} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export function V2ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Stack spacing={1}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={58} />
      ))}
    </Stack>
  );
}

export function V2DrawerSkeleton() {
  return (
    <Stack spacing={2}>
      <Skeleton width="50%" height={28} />
      <V2ListSkeleton rows={4} />
    </Stack>
  );
}

export function V2PageContentSkeleton() {
  return (
    <Stack spacing={3}>
      <Box>
        <Skeleton width={160} height={18} />
        <Skeleton width={280} height={42} />
        <Skeleton width={420} height={22} />
      </Box>
      <Grid container spacing={3}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Grid key={index} size={{ xs: 12, md: 6, xl: 3 }}>
            <V2MetricCardSkeleton />
          </Grid>
        ))}
      </Grid>
      <V2TableSkeleton />
    </Stack>
  );
}
