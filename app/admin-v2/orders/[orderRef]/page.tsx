import { notFound } from "next/navigation";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { hasPermission } from "@/app/lib/admin-permissions";
import { getAdminV2Order } from "@/lib/admin-v2/orders";
import {
  getAdminV2OrderPaymentHistory,
  type AdminV2OrderPaymentHistoryResult,
} from "@/lib/admin-v2/transactions/transactions-query";
import { AdminV2OrderDetailView } from "@/components/admin-v2/views/orders/detail";

export default async function AdminV2OrderDetailPage(props: PageProps<"/admin-v2/orders/[orderRef]">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "orderDetail");
  const { orderRef } = await props.params;
  const canViewPaymentHistory = hasPermission(session, "finance.transactions.view");
  const [payload, paymentHistory] = await Promise.all([
    getAdminV2Order(orderRef),
    canViewPaymentHistory
      ? getAdminV2OrderPaymentHistory(orderRef)
      : Promise.resolve({
          rows: [],
          queryFailed: false,
          truncated: false,
          limitation: "Payment ledger history requires finance.transactions.view.",
        } satisfies AdminV2OrderPaymentHistoryResult),
  ]);

  if (!payload.order) notFound();

  return (
    <AdminV2OrderDetailView
      order={payload.order}
      paymentHistory={paymentHistory}
      storageMode={payload.storageMode}
      permissions={{
        canEditStatus: hasPermission(session, "orders.editStatus"),
        canEditCourier: hasPermission(session, "orders.editCourier"),
        canRecordPayment: hasPermission(session, "finance.payments.record"),
        canViewPaymentHistory,
        canViewInvoice: hasPermission(session, "orders.viewInvoice"),
        canIssueInvoice: hasPermission(session, "orders.issueInvoice"),
        canAddNote: hasPermission(session, "orders.addNote"),
      }}
    />
  );
}
