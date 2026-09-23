import { Box, Chip, Divider, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import type { getAdminCustomerDetail } from "@/app/lib/customer-account-store";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { formatCustomerDate, formatCustomerMoney } from "@/lib/admin-v2/customers/customer-format";

type Detail = NonNullable<Awaited<ReturnType<typeof getAdminCustomerDetail>>>;

export function AdminV2CustomerDetailView({ detail }: { detail: Detail }) {
  const { customer, addresses, orders } = detail;
  const summary = [["Total orders", detail.orderCount], ["Total spent", formatCustomerMoney(detail.totalSpent)], ["Saved addresses", addresses.length], ["Last order", formatCustomerDate(detail.latestOrderAt)]];
  return <>
    <V2PageHeader title={customer.fullName || "Customer"} description="Registered customer profile and linked orders." breadcrumbs={[{ label: "Customers", href: "/admin-v2/customers" }, { label: customer.fullName || "Customer" }]} actions={<V2Button href="/admin-v2/customers" variant="outlined">Back to Customers</V2Button>} />
    <V2Card>
      <Typography variant="h6">Customer identity</Typography>
      <Stack direction="row" sx={{ mt: 2, gap: 3, flexWrap: "wrap" }}>
        <Box><Typography variant="caption" color="text.secondary">Name</Typography><Typography>{customer.fullName || "—"}</Typography></Box>
        <Box><Typography variant="caption" color="text.secondary">Phone</Typography><Typography>{customer.phone || "—"}</Typography></Box>
        <Box><Typography variant="caption" color="text.secondary">Email</Typography><Typography>{customer.email || "—"}</Typography></Box>
        <Box><Typography variant="caption" color="text.secondary">Status</Typography><Box><Chip size="small" label={customer.isActive ? "Active" : "Inactive"} color={customer.isActive ? "success" : "default"} /></Box></Box>
        <Box><Typography variant="caption" color="text.secondary">Joined</Typography><Typography>{formatCustomerDate(customer.createdAt)}</Typography></Box>
        <Box><Typography variant="caption" color="text.secondary">Last login</Typography><Typography>{formatCustomerDate(customer.lastLoginAt)}</Typography></Box>
      </Stack>
      <Divider sx={{ my: 3 }} />
      <Typography variant="h6">Summary</Typography>
      <Stack direction="row" sx={{ mt: 2, flexWrap: "wrap", gap: 2 }}>{summary.map(([label, value], index) => <Box key={label} sx={{ flex: "1 1 160px", pl: index ? 2 : 0, borderLeft: index ? 1 : 0, borderColor: "divider" }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="h6">{value}</Typography></Box>)}</Stack>
      <Divider sx={{ my: 3 }} />
      <Typography variant="h6">Saved addresses</Typography>
      {addresses.length ? <Stack sx={{ mt: 2, gap: 1.5 }}>{addresses.map((address) => <Box key={address.id} sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1.5 }}><Stack direction="row" sx={{ gap: 1, alignItems: "center" }}><Typography sx={{ fontWeight: 700 }}>{address.label}</Typography>{address.isDefault && <Chip size="small" label="Default" />}</Stack><Typography variant="body2">{address.fullName} · {address.phone}</Typography><Typography variant="body2">{address.address}, {address.cityArea}</Typography><Typography variant="caption" color="text.secondary">Delivery zone: {address.deliveryZone || "—"}</Typography></Box>)}</Stack> : <Typography color="text.secondary" sx={{ mt: 1 }}>No saved addresses.</Typography>}
      <Divider sx={{ my: 3 }} />
      <Typography variant="h6">Order history</Typography>
      {orders.length ? <TableContainer sx={{ mt: 2 }}><Table size="small" aria-label="Customer order history"><TableHead><TableRow><TableCell>Reference</TableCell><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell align="right">Total</TableCell><TableCell>Open</TableCell></TableRow></TableHead><TableBody>{orders.map((order) => <TableRow key={order.orderRef}><TableCell>{order.orderRef}</TableCell><TableCell>{formatCustomerDate(order.createdAt)}</TableCell><TableCell>{order.status}</TableCell><TableCell align="right">{formatCustomerMoney(order.total)}</TableCell><TableCell><V2Button href={`/admin-v2/orders/${encodeURIComponent(order.orderRef)}`} size="small">View Order</V2Button></TableCell></TableRow>)}</TableBody></Table></TableContainer> : <Typography color="text.secondary" sx={{ mt: 1 }}>No linked orders. Guest orders are not included.</Typography>}
    </V2Card>
  </>;
}
