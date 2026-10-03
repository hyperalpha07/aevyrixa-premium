import { Alert, Box, Stack } from "@mui/material";
import { AdminV2InvoiceDetailView } from "@/components/admin-v2/views/invoices/AdminV2InvoiceDetailView";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { getAdminV2InvoiceByNumber } from "@/lib/admin-v2/invoices/invoices-query";

export default async function AdminV2InvoiceDetailPage(props: PageProps<"/admin-v2/invoices/[invoiceNumber]">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "invoices");
  const { invoiceNumber } = await props.params;
  const search = await props.searchParams;
  const data = await getAdminV2InvoiceByNumber(invoiceNumber);
  const print = search?.print === "1";

  if (!data.invoice) {
    return (
      <Box component="section" aria-labelledby="admin-v2-invoice-not-found-title">
        <V2PageHeader
          title="Invoice not found"
          titleId="admin-v2-invoice-not-found-title"
          titleComponent="h1"
          description="This invoice number was not found in the existing invoice table."
          breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Invoices", href: "/admin-v2/invoices" }, { label: "Not found" }]}
        />
        <Stack spacing={2.5}>
          <Alert severity={data.storageAvailable ? "warning" : "error"}>{data.limitation ?? "Invoice not found."}</Alert>
          <Box>
            <V2Button href="/admin-v2/invoices" variant="contained">Back to invoices</V2Button>
          </Box>
        </Stack>
      </Box>
    );
  }

  return <AdminV2InvoiceDetailView invoice={data.invoice} autoPrint={print} />;
}
