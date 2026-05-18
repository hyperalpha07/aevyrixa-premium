import { customerErrorResponse, getCustomerFromRequest, safeSessionPayload } from "@/app/api/account/_utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return Response.json({ customer: null }, { status: 401 });
    }
    return Response.json(safeSessionPayload(customer));
  } catch (error) {
    return customerErrorResponse(error);
  }
}
