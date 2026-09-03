"use client";

import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { V2EmptyState } from "@/components/admin-v2/shared/V2EmptyState";
import { V2TableSkeleton } from "@/components/admin-v2/feedback/V2Skeleton";
import { adminV2Motion, adminV2Transition } from "@/components/admin-v2/motion/motion-config";

type V2TableShellProps<T> = {
  columns: string[];
  rows: T[];
  renderRow: (row: T) => ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  loading?: boolean;
  selectedRowKey?: string;
};

export function V2TableShell<T>({ columns, rows, renderRow, emptyTitle, emptyDescription, loading }: V2TableShellProps<T>) {
  if (loading) {
    return <V2TableSkeleton rows={5} columns={columns.length} />;
  }

  if (rows.length === 0) {
    return <V2EmptyState title={emptyTitle} description={emptyDescription} compact />;
  }

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        transition: adminV2Transition(["border-color", "box-shadow"], adminV2Motion.duration.hover),
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column} sx={{ fontWeight: 700, color: "text.secondary", bgcolor: "action.hover" }}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                  <span>{column}</span>
                  <ArrowUpDown size={13} opacity={0.38} />
                </Stack>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody
          sx={{
            "& .MuiTableRow-root": {
              transition: adminV2Transition(["background-color", "box-shadow"], adminV2Motion.duration.micro),
            },
            "& .MuiTableRow-hover:hover": {
              bgcolor: "action.hover",
            },
            "& .MuiTableRow-root[aria-selected='true']": {
              bgcolor: "action.selected",
            },
          }}
        >
          {rows.map((row) => renderRow(row))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
