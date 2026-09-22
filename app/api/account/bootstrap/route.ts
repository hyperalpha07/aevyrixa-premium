import { customerErrorResponse, requireCustomer, safeSessionPayload } from "@/app/api/account/_utils";
import { listSafeCustomerOrders } from "@/app/api/account/orders/account-order-data";
import { listCustomerAddresses } from "@/app/lib/customer-account-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const view = new URL(request.url).searchParams.get("view");
  if (view !== "dashboard" && view !== "orders") {
    return Response.json({ errors: ["Unknown account view."] }, { status: 400 });
  }

  try {
    const { customer, response } = await requireCustomer(request);
    if (!customer) return response;

    if (view === "orders") {
      const { orders } = await listSafeCustomerOrders(customer);
      return Response.json({ ...safeSessionPayload(customer), orders }, { headers: { "cache-control": "private, no-store" } });
    }

    const [{ orders }, addresses] = await Promise.all([
      listSafeCustomerOrders(customer),
      listCustomerAddresses(customer.id),
    ]);
    return Response.json(
      { ...safeSessionPayload(customer), orders, addressCount: addresses.length },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    return customerErrorResponse(error);
  }
}
