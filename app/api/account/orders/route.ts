import { requireCustomer, customerErrorResponse } from "@/app/api/account/_utils";
import { listSafeCustomerOrders } from "@/app/api/account/orders/account-order-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { customer, response } = await requireCustomer(request);
    if (!customer) return response;
    const result = await listSafeCustomerOrders(customer);
    return Response.json(result, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return customerErrorResponse(error);
  }
}
