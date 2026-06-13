import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import type { ReactNode } from "react";
import { V2EmptyState } from "@/components/admin-v2/shared/V2EmptyState";

type V2TableShellProps<T> = {
  columns: string[];
  rows: T[];
  renderRow: (row: T) => ReactNode;
  emptyTitle: string;
  emptyDescription: string;
};

export function V2TableShell<T>({ columns, rows, renderRow, emptyTitle, emptyDescription }: V2TableShellProps<T>) {
  if (rows.length === 0) {
    return <V2EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column} sx={{ fontWeight: 700 }}>
                {column}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{rows.map((row) => renderRow(row))}</TableBody>
      </Table>
    </TableContainer>
  );
}
