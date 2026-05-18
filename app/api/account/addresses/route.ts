import {
  createCustomerAddress,
  listCustomerAddresses,
} from "@/app/lib/customer-account-store";
import { customerErrorResponse, requireCustomer } from "@/app/api/account/_utils";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function bool(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function addressInput(payload: unknown) {
  const body = isRecord(payload) ? payload : {};
  return {
    label: text(body.label) || "Home",
    fullName: text(body.fullName),
    phone: text(body.phone),
    cityArea: text(body.cityArea),
    address: text(body.address),
    deliveryZone: text(body.deliveryZone) || undefined,
    isDefault: bool(body.isDefault),
  };
}

export async function GET(request: Request) {
  try {
    const { customer, response } = await requireCustomer(request);
    if (!customer) return response;
    const addresses = await listCustomerAddresses(customer.id);
    return Response.json({ addresses });
  } catch (error) {
    return customerErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { customer, response } = await requireCustomer(request);
    if (!customer) return response;
    const payload = await request.json().catch(() => null);
    const address = await createCustomerAddress(customer.id, addressInput(payload));
    return Response.json({ address }, { status: 201 });
  } catch (error) {
    return customerErrorResponse(error);
  }
}
