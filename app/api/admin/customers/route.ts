import {
  forbiddenAdminResponse,
  getFreshAdminRequestSession,
  unauthorizedAdminResponse,
} from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { CustomerAccountError, listAdminCustomerOverviews } from "@/app/lib/customer-account-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "customers.view")) return forbiddenAdminResponse();

  try {
    const customers = await listAdminCustomerOverviews();
    return Response.json({ customers });
  } catch (error) {
    console.error("Failed to load admin customers:", error);
    if (error instanceof CustomerAccountError) {
      return Response.json({ errors: [error.publicMessage], code: error.code }, { status: error.status });
    }
    return Response.json({ errors: ["Customers could not be loaded."] }, { status: 500 });
  }
}
