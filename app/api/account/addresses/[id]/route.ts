import {
  deleteCustomerAddress,
  setDefaultCustomerAddress,
  updateCustomerAddress,
} from "@/app/lib/customer-account-store";
import { customerErrorResponse, requireCustomer } from "@/app/api/account/_utils";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function addressUpdates(payload: unknown) {
  const body = isRecord(payload) ? payload : {};
  return {
    label: "label" in body ? text(body.label) || "Home" : undefined,
    fullName: "fullName" in body ? text(body.fullName) : undefined,
    phone: "phone" in body ? text(body.phone) : undefined,
    cityArea: "cityArea" in body ? text(body.cityArea) : undefined,
    address: "address" in body ? text(body.address) : undefined,
    deliveryZone: "deliveryZone" in body ? text(body.deliveryZone) || undefined : undefined,
    isDefault: "isDefault" in body ? body.isDefault === true : undefined,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { customer, response } = await requireCustomer(request);
    if (!customer) return response;
    const { id } = await context.params;
    const payload = await request.json().catch(() => null);
    const address = isRecord(payload) && payload.action === "set_default"
      ? await setDefaultCustomerAddress(customer.id, id)
      : await updateCustomerAddress(customer.id, id, addressUpdates(payload));
    return Response.json({ address });
  } catch (error) {
    return customerErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { customer, response } = await requireCustomer(request);
    if (!customer) return response;
    const { id } = await context.params;
    await deleteCustomerAddress(customer.id, id);
    return Response.json({ ok: true });
  } catch (error) {
    return customerErrorResponse(error);
  }
}
