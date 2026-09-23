import Link from "next/link";
import { Box, Button, Chip, Divider, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import type { AdminCustomerOverview } from "@/app/lib/customer-account-store";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { customerListHref, type CustomerFilter } from "@/lib/admin-v2/customers/customer-query";
import { formatCustomerDate, formatCustomerMoney } from "@/lib/admin-v2/customers/customer-format";

type Props = {
  allCustomers: AdminCustomerOverview[];
  customers: AdminCustomerOverview[];
  query: string;
  filter: CustomerFilter;
  page: number;
  totalPages: number;
  totalCount: number;
};

const filters: Array<[CustomerFilter, string]> = [["all", "All"], ["has-orders", "Has orders"], ["no-orders", "No orders"], ["repeat", "Repeat customers"]];

export function AdminV2CustomersView({ allCustomers, customers, query, filter, page, totalPages, totalCount }: Props) {
  const metrics = [
    ["Total customers", allCustomers.length],
    ["Customers with orders", allCustomers.filter((item) => item.orderCount > 0).length],
    ["Repeat customers", allCustomers.filter((item) => item.orderCount > 1).length],
    ["Total customer spend", formatCustomerMoney(allCustomers.reduce((sum, item) => sum + item.totalSpent, 0))],
  ];
  return <>
    <V2PageHeader title="Customers" description="Registered customer accounts and linked order history." />
    <V2Card sx={{ mb: 2.5 }}>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2 }}>
        {metrics.map(([label, value], index) => <Box key={label} sx={{ flex: "1 1 180px", minWidth: 0, pl: index ? 2 : 0, borderLeft: index ? 1 : 0, borderColor: "divider" }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="h6">{value}</Typography></Box>)}
      </Stack>
    </V2Card>
    <V2Card>
      <Stack direction="row" sx={{ mb: 2, gap: 2, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Box component="form" action="/admin-v2/customers" method="get" sx={{ display: "flex", gap: 1 }}>
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <input name="q" type="search" defaultValue={query} placeholder="Search name, phone, or email" aria-label="Search customers" style={{ minWidth: 270, padding: "9px 12px", borderRadius: 8 }} />
          <Button type="submit" variant="contained">Search</Button>
        </Box>
        <Typography variant="body2" color="text.secondary">{totalCount} matching customers</Typography>
      </Stack>
      <Stack direction="row" sx={{ mb: 2, gap: 1, flexWrap: "wrap" }}>
        {filters.map(([value, label]) => <V2Button key={value} href={customerListHref(query, value)} size="small" variant={filter === value ? "contained" : "outlined"}>{label}</V2Button>)}
      </Stack>
      <TableContainer>
        <Table size="small" aria-label="Customers"><TableHead><TableRow>
          <TableCell>Customer</TableCell><TableCell>Status</TableCell><TableCell align="right">Orders</TableCell><TableCell align="right">Total spent</TableCell><TableCell align="right">Saved addresses</TableCell><TableCell>Last order</TableCell><TableCell>Joined</TableCell><TableCell>Open</TableCell>
        </TableRow></TableHead><TableBody>
          {customers.map((customer) => <TableRow key={customer.id} hover>
            <TableCell><Link href={`/admin-v2/customers/${encodeURIComponent(customer.id)}`} style={{ textDecoration: "none" }}><Typography sx={{ fontWeight: 700, color: "primary.main" }}>{customer.fullName || "Unnamed customer"}</Typography></Link><Typography variant="body2">{customer.phone || "—"}</Typography><Typography variant="caption" color="text.secondary">{customer.email || "—"}</Typography></TableCell>
            <TableCell><Chip size="small" label={customer.isActive ? "Active" : "Inactive"} color={customer.isActive ? "success" : "default"} /></TableCell>
            <TableCell align="right">{customer.orderCount}</TableCell><TableCell align="right">{formatCustomerMoney(customer.totalSpent)}</TableCell><TableCell align="right">{customer.savedAddressesCount}</TableCell><TableCell>{formatCustomerDate(customer.latestOrderAt)}</TableCell><TableCell>{formatCustomerDate(customer.createdAt)}</TableCell>
            <TableCell><V2Button href={`/admin-v2/customers/${encodeURIComponent(customer.id)}`} size="small">View</V2Button></TableCell>
          </TableRow>)}
        </TableBody></Table>
      </TableContainer>
      {!customers.length && <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No customers match this search or filter.</Typography>}
      <Divider sx={{ my: 2 }} />
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}><Typography variant="body2" color="text.secondary">Page {page} of {totalPages}</Typography><Stack direction="row" sx={{ gap: 1 }}><V2Button href={customerListHref(query, filter, page - 1)} disabled={page <= 1}>Previous</V2Button><V2Button href={customerListHref(query, filter, page + 1)} disabled={page >= totalPages}>Next</V2Button></Stack></Stack>
    </V2Card>
  </>;
}
