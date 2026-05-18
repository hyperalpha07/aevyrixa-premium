import { customerErrorResponse, requireCustomer } from "@/app/api/account/_utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { customer, response } = await requireCustomer(request);
    if (!customer) return response;

    return Response.json({
      conversations: [],
      linked: false,
      message:
        "Live chat conversations are currently token-based and are not safely linked to customer accounts yet.",
    });
  } catch (error) {
    return customerErrorResponse(error);
  }
}
